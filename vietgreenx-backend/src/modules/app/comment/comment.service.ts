import { CommentRepository } from '@app/database/typeorm/repositories/comment.repository';
import { PostRepository } from '@app/database/typeorm/repositories/post.repository';
import { ReactionRepository } from '@app/database/typeorm/repositories/reaction.repository';
import { Injectable } from '@nestjs/common';
import { CreateCommentRequestDto } from './dto/requests/create-comment.request.dto';
import { User } from '@app/database/typeorm/entities';
import {
	ErrorCode,
	HttpForbiddenError,
	HttpNotFoundError,
} from '@app/common/errors';
import { Comment } from '@app/database/typeorm/entities';
import { GetCommentsQueryRequestDto } from './dto/requests/get-comments-query.request.dto';
import { UpdateCommentRequestDto } from './dto/requests/update-comment.request.dto';
import { PostService } from '@app/modules/app/post/post.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CommentCreatedEvent } from './events/comment-created.event';
import { CommentDeletedEvent } from './events/comment-deleted.event';
import { CommentSort } from '@app/common/enums/comment-sort.enum';
import { ReactionTargetType } from '@app/common/enums/reaction-target-type.enum';
import { In } from 'typeorm';

@Injectable()
export class CommentService {
	constructor(
		private readonly commentRepository: CommentRepository,
		private readonly postRepository: PostRepository,
		private readonly postService: PostService,
		private readonly eventEmitter: EventEmitter2,
		private readonly reactionRepository: ReactionRepository,
	) {}

	async create(dto: CreateCommentRequestDto, user: User): Promise<Comment> {
		const post = await this.postRepository.findOne({
			id: dto.postId,
		});

		if (!post) {
			throw new HttpNotFoundError(ErrorCode.POST_NOT_FOUND);
		}

		await this.postService.assertCanViewPost(post, user.id);

		let parentCommentId: string | null = dto.parentCommentId || null;
		let replyToCommentId: string | null = null;
		let replyToUserId: string | null = null;

		if (dto.parentCommentId) {
			const parent = await this.commentRepository.findOne({
				id: dto.parentCommentId,
			});

			if (!parent) {
				throw new HttpNotFoundError(ErrorCode.COMMENT_NOT_FOUND);
			}

			if (parent.postId !== dto.postId) {
				throw new HttpNotFoundError(
					ErrorCode.COMMENT_PARENT_NOT_BELONG_TO_POST,
				);
			}

			// Facebook-style: flatten reply-of-reply to root comment
			if (parent.parentCommentId !== null) {
				replyToCommentId = parent.id;
				replyToUserId = parent.authorId;
				parentCommentId = parent.parentCommentId;
			}
		}

		const savedComment = await this.commentRepository.create({
			postId: dto.postId,
			parentCommentId,
			replyToCommentId,
			replyToUserId,
			body: dto.body,
			authorId: user.id,
		});

		const comment = await this.commentRepository.findOne(
			{ id: savedComment.id },
			[
				'author',
				'author.profile',
				'author.profile.avatarMedia',
				'replyToUser',
				'replyToUser.profile',
			],
		);

		if (!comment) {
			throw new HttpNotFoundError(ErrorCode.COMMENT_NOT_FOUND);
		}

		this.eventEmitter.emit('comment.created', new CommentCreatedEvent(comment));

		return comment;
	}

	async findAll(query: GetCommentsQueryRequestDto, viewerId: string) {
		const post = await this.postRepository.findOne({ id: query.postId });

		if (!post) {
			throw new HttpNotFoundError(ErrorCode.POST_NOT_FOUND);
		}

		await this.postService.assertCanViewPost(post, viewerId);

		const qb = this.commentRepository
			.createQueryBuilder('comment')
			.leftJoinAndSelect('comment.author', 'author')
			.leftJoinAndSelect('author.profile', 'profile')
			.leftJoinAndSelect('profile.avatarMedia', 'avatarMedia')
			.leftJoinAndSelect('comment.replyToUser', 'replyToUser')
			.leftJoinAndSelect('replyToUser.profile', 'replyToUserProfile')
			.where('comment.postId = :postId', { postId: query.postId })
			.andWhere('comment.deletedAt IS NULL');
		if (query.parentCommentId) {
			qb.andWhere('comment.parentCommentId = :parentCommentId', {
				parentCommentId: query.parentCommentId,
			});
		} else {
			qb.andWhere('comment.parentCommentId IS NULL');
		}

		let cursorKeys: (keyof Comment & string)[] = ['createdAt', 'id'];

		if (query.sort === CommentSort.NEWEST) {
			qb.orderBy('comment.createdAt', 'DESC').addOrderBy('comment.id', 'DESC');
		} else if (query.sort === CommentSort.MOST_LIKED) {
			qb.orderBy('comment.likeCount', 'DESC')
				.addOrderBy('comment.createdAt', 'DESC')
				.addOrderBy('comment.id', 'DESC');

			cursorKeys = ['likeCount', 'createdAt', 'id'];
		} else {
			qb.orderBy('comment.createdAt', 'ASC').addOrderBy('comment.id', 'ASC');
		}

		const paginated = await this.commentRepository.paginateWithCursor(
			qb,
			cursorKeys,
			query.cursor,
			query.limit,
		);

		const commentIds = paginated.data.map((c) => c.id);
		const viewerReactions =
			commentIds.length > 0
				? await this.reactionRepository.findAll({
						where: {
							targetType: ReactionTargetType.COMMENT,
							targetId: In(commentIds),
							userId: viewerId,
						},
						select: ['targetId', 'reaction'],
					})
				: [];

		const reactionMap = new Map(
			viewerReactions.map((r) => [r.targetId, r.reaction]),
		);

		const data = paginated.data.map((c) => ({
			...c,
			reactionCount: c.likeCount,
			userReaction: reactionMap.get(c.id) ?? null,
		}));

		return { ...paginated, data };
	}

	async remove(id: string, user: User): Promise<void> {
		const comment = await this.commentRepository.findOne({ id }, ['post']);

		if (!comment) {
			throw new HttpNotFoundError(ErrorCode.COMMENT_NOT_FOUND);
		}

		if (!comment.post) {
			throw new HttpNotFoundError(ErrorCode.POST_NOT_FOUND);
		}

		await this.postService.assertCanViewPost(comment.post, user.id);

		if (comment.authorId !== user.id && comment.post.authorId !== user.id) {
			throw new HttpForbiddenError(ErrorCode.COMMENT_FORBIDDEN);
		}

		const deleted = await this.commentRepository.softDelete(id);

		// Only emit if this request actually performed the delete.
		// Under concurrent requests, the second softDelete is a no-op (affected = 0)
		// and must not fire the event — otherwise comment_count would be decremented twice.
		if (deleted) {
			this.eventEmitter.emit(
				'comment.deleted',
				new CommentDeletedEvent(
					comment.id,
					comment.postId,
					comment.parentCommentId,
					user.id,
				),
			);
		}
	}

	async update(
		id: string,
		dto: UpdateCommentRequestDto,
		user: User,
	): Promise<Comment> {
		const comment = await this.commentRepository.findOne({ id }, ['post']);

		if (!comment) {
			throw new HttpNotFoundError(ErrorCode.COMMENT_NOT_FOUND);
		}

		if (!comment.post) {
			throw new HttpNotFoundError(ErrorCode.POST_NOT_FOUND);
		}

		await this.postService.assertCanViewPost(comment.post, user.id);

		if (comment.authorId !== user.id) {
			throw new HttpForbiddenError(ErrorCode.COMMENT_FORBIDDEN);
		}

		await this.commentRepository.update(id, {
			body: dto.body,
			version: comment.version + 1,
		});

		const updatedComment = await this.commentRepository.findOne({ id }, [
			'author',
			'author.profile',
			'author.profile.avatarMedia',
		]);

		if (!updatedComment) {
			throw new HttpNotFoundError(ErrorCode.COMMENT_NOT_FOUND);
		}

		return updatedComment;
	}
}
