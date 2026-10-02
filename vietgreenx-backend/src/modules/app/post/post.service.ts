import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, In, QueryFailedError, Repository } from 'typeorm';
import { Follow } from '@app/database/typeorm/entities/social-graph/follow.entity';
import { PostRepository } from '@app/database/typeorm/repositories/post.repository';
import { CategoryRepository } from '@app/database/typeorm/repositories/category.repository';
import { MediaRepository } from '@app/database/typeorm/repositories/media.repository';
import { ProfileRepository } from '@app/database/typeorm/repositories/profile.repository';
import { Post } from '@app/database/typeorm/entities/content/post.entity';
import { PostMedia } from '@app/database/typeorm/entities/content/post-media.entity';
import { PostTag } from '@app/database/typeorm/entities/content/post-tag.entity';
import { Hashtag } from '@app/database/typeorm/entities/content/hashtag.entity';
import { PostHashtag } from '@app/database/typeorm/entities/content/post-hashtag.entity';
import { Product } from '@app/database/typeorm/entities/agriculture/product.entity';
import { User } from '@app/database/typeorm/entities/identity/user.entity';
import { Profile } from '@app/database/typeorm/entities/identity/profile.entity';
import { CreatePostRequestDto } from './dto/requests/create-post.request.dto';
import { UpdatePostRequestDto } from './dto/requests/update-post.request.dto';
import { PostTagRequestDto } from './dto/requests/post-tag.request.dto';
import { VisibilityType } from '@app/common/enums/visibility-type.enum';
import { PostTagType } from '@app/common/enums/post-tag-type.enum';
import { FollowStatus } from '@app/common/enums/follow-status.enum';
import { HttpNotFoundError } from '@app/common/errors/not-found.error';
import { HttpBadRequestError } from '@app/common/errors/bad-request.error';
import { HttpForbiddenError } from '@app/common/errors/forbidden.error';
import { ErrorCode } from '@app/common/errors/error-code';
import { PaginationDto } from '@app/common/dtos/paginationDto';
import { MediaUploadService } from '@app/modules/app/media/media-upload.service';
import { BlockService } from '@app/modules/app/block/block.service';
import {
	MAX_HASHTAGS_PER_POST,
	normalizeHashtagToken,
	parseHashtagsFromBody,
} from './utils/parse-post-hashtags';
import { HashtagSearchResponseDto } from './dto/responses/hashtag-search.response.dto';
import { PostSource } from '@app/common/enums/post-source.enum';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PostCreatedEvent } from './events/post-created.event';
import { RedisService } from '@app/services/redis/redis.service';
import { ReactionRepository } from '@app/database/typeorm/repositories/reaction.repository';
import { ReactionTargetType } from '@app/common/enums/reaction-target-type.enum';

const MAX_POST_MEDIA = 9;

@Injectable()
export class PostService {
	constructor(
		private readonly postRepository: PostRepository,
		private readonly categoryRepository: CategoryRepository,
		private readonly mediaRepository: MediaRepository,
		private readonly profileRepository: ProfileRepository,
		private readonly mediaUploadService: MediaUploadService,
		private readonly blockService: BlockService,
		@InjectRepository(Follow)
		private readonly followRepository: Repository<Follow>,
		@InjectRepository(PostMedia)
		private readonly postMediaRepository: Repository<PostMedia>,
		@InjectRepository(PostTag)
		private readonly postTagRepository: Repository<PostTag>,
		@InjectRepository(PostHashtag)
		private readonly postHashtagRepository: Repository<PostHashtag>,
		@InjectRepository(Hashtag)
		private readonly hashtagRepository: Repository<Hashtag>,
		@InjectRepository(Product)
		private readonly productRepository: Repository<Product>,
		private readonly eventEmitter: EventEmitter2,
		private readonly redisService: RedisService,
		private readonly reactionRepository: ReactionRepository,
	) {}

	async create(user: User, dto: CreatePostRequestDto) {
		const mediaIds = dto.mediaIds ?? [];
		this.assertPostBodyOrMedia(dto.body, mediaIds);
		await this.validateMediaIds(user.id, mediaIds);
		await this.validateTags(dto.tags ?? []);

		const post = await this.postRepository.executeInTransaction(
			async (manager) => {
				const saved = await manager.getRepository(Post).save(
					manager.getRepository(Post).create({
						authorId: user.id,
						body: dto.body?.trim() || null,
						category: dto.category ?? null,
						visibility: dto.visibility ?? VisibilityType.PUBLIC,
						isDraft: false,
					}),
				);
				await this.replacePostMedia(manager, saved.id, mediaIds);
				await this.replacePostTags(manager, saved.id, dto.tags ?? []);
				await this.replacePostHashtags(manager, saved.id, saved.body);
				return saved;
			},
		);

		this.eventEmitter.emit('post.created', new PostCreatedEvent(post));

		await Promise.all([
			this.redisService.delPattern('cache:feed:discovery:*'),
			this.redisService.delPattern('cache:feed:following:*'),
		]);

		return this.loadPostDetail(post.id, user.id);
	}

	async syncHashtagsInTransaction(
		manager: EntityManager,
		postId: string,
		body: string | null | undefined,
	): Promise<void> {
		await this.replacePostHashtags(manager, postId, body);
	}

	async update(user: User, postId: string, dto: UpdatePostRequestDto) {
		const post = await this.findOwnedPost(postId, user.id);

		const nextBody =
			dto.body !== undefined ? dto.body.trim() || null : post.body;
		const nextMediaIds =
			dto.mediaIds !== undefined
				? dto.mediaIds
				: await this.getMediaIds(postId);

		this.assertPostBodyOrMedia(nextBody, nextMediaIds);

		if (dto.mediaIds !== undefined) {
			await this.validateMediaIds(user.id, dto.mediaIds);
		}
		if (dto.tags !== undefined) {
			await this.validateTags(dto.tags);
		}

		await this.postRepository.executeInTransaction(async (manager) => {
			await manager.getRepository(Post).update(post.id, {
				body: nextBody,
				...(dto.category !== undefined && { category: dto.category }),
				...(dto.visibility !== undefined && { visibility: dto.visibility }),
				isEdited: true,
			});
			if (dto.mediaIds !== undefined) {
				await this.replacePostMedia(manager, post.id, dto.mediaIds);
			}
			if (dto.tags !== undefined) {
				await this.replacePostTags(manager, post.id, dto.tags);
			}
			if (dto.body !== undefined) {
				await this.replacePostHashtags(manager, post.id, nextBody);
			}
		});

		await Promise.all([
			this.redisService.delPattern('cache:feed:discovery:*'),
			this.redisService.delPattern('cache:feed:following:*'),
		]);

		return this.loadPostDetail(postId, user.id);
	}

	async findOne(postId: string, viewerId?: string) {
		const post = await this.postRepository.findById(postId);
		if (!post) {
			throw new HttpNotFoundError(ErrorCode.POST_NOT_FOUND);
		}
		await this.assertCanViewPost(post, viewerId);
		return this.loadPostDetail(postId, viewerId);
	}

	async assertCanViewPost(post: Post, viewerId?: string): Promise<void> {
		if (post.isDraft) {
			if (!viewerId || post.authorId !== viewerId) {
				throw new HttpNotFoundError(ErrorCode.POST_NOT_FOUND);
			}
			return;
		}

		if (viewerId && post.authorId === viewerId) {
			return;
		}

		if (
			viewerId &&
			(await this.blockService.isEitherBlocked(viewerId, post.authorId))
		) {
			throw new HttpNotFoundError(ErrorCode.POST_NOT_FOUND);
		}

		if (post.visibility === VisibilityType.PUBLIC) {
			return;
		}

		if (!viewerId) {
			throw new HttpNotFoundError(ErrorCode.POST_NOT_FOUND);
		}

		if (post.visibility === VisibilityType.PRIVATE) {
			throw new HttpNotFoundError(ErrorCode.POST_NOT_FOUND);
		}

		if (post.visibility === VisibilityType.FOLLOWERS_ONLY) {
			const query = this.followRepository
				.createQueryBuilder('follow')
				.where('follow.followerId = :viewerId', { viewerId })
				.andWhere('follow.status = :status', { status: FollowStatus.ACTIVE });

			if (post.orgId) {
				query.andWhere('follow.followeeOrgId = :orgId', { orgId: post.orgId });
			} else {
				query.andWhere('follow.followeeUserId = :authorId', {
					authorId: post.authorId,
				});
			}

			const isFollowing = await query.getOne();
			if (!isFollowing) {
				throw new HttpNotFoundError(ErrorCode.POST_NOT_FOUND);
			}
		}
	}

	async findMine(user: User, pagination: PaginationDto) {
		const result = await this.postRepository.findWithPagination(
			pagination.page,
			pagination.limit,
			{
				where: { authorId: user.id },
				order: { createdAt: 'DESC' },
			},
		);

		const items = await Promise.all(
			result.items.map((post) => this.loadPostDetail(post.id, user.id)),
		);

		return { ...result, items };
	}

	async remove(user: User, postId: string): Promise<void> {
		const post = await this.findOwnedPost(postId, user.id);

		await this.postRepository.executeInTransaction(async (manager) => {
			await this.replacePostHashtags(manager, post.id, null);
			const result = await manager.getRepository(Post).softDelete(post.id);
			if (!result.affected) {
				throw new HttpNotFoundError(ErrorCode.POST_NOT_FOUND);
			}
		});

		await Promise.all([
			this.redisService.delPattern('cache:feed:discovery:*'),
			this.redisService.delPattern('cache:feed:following:*'),
		]);
	}

	async searchHashtags(
		q: string,
		limit: number,
	): Promise<HashtagSearchResponseDto> {
		const prefix = normalizeHashtagToken(q).replace(/[_%\\]/g, '\\$&');
		const rows = await this.hashtagRepository
			.createQueryBuilder('hashtag')
			.where("hashtag.tag LIKE :prefix ESCAPE '\\'", { prefix: `${prefix}%` })
			.orderBy('hashtag.post_count', 'DESC')
			.addOrderBy('hashtag.tag', 'ASC')
			.limit(limit)
			.getMany();

		return {
			items: rows.map((row) => ({
				tag: row.tag,
				postCount: row.postCount,
			})),
		};
	}

	private async findOwnedPost(postId: string, userId: string): Promise<Post> {
		const post = await this.postRepository.findById(postId);
		if (!post) {
			throw new HttpNotFoundError(ErrorCode.POST_NOT_FOUND);
		}
		if (post.authorId !== userId) {
			throw new HttpForbiddenError(ErrorCode.POST_FORBIDDEN);
		}
		return post;
	}

	assertPostBodyOrMedia(
		body: string | null | undefined,
		mediaIds: string[],
	): void {
		const hasBody = Boolean(body?.trim());
		const hasMedia = mediaIds.length > 0;
		if (!hasBody && !hasMedia) {
			throw new HttpBadRequestError(ErrorCode.POST_BODY_OR_MEDIA_REQUIRED);
		}
	}

	private async validateMediaIds(
		userId: string,
		mediaIds: string[],
	): Promise<void> {
		if (mediaIds.length === 0) return;

		if (mediaIds.length > MAX_POST_MEDIA) {
			throw new HttpBadRequestError(ErrorCode.POST_MEDIA_LIMIT_EXCEEDED);
		}

		const uniqueIds = [...new Set(mediaIds)];
		if (uniqueIds.length !== mediaIds.length) {
			throw new HttpBadRequestError(ErrorCode.POST_MEDIA_NOT_FOUND);
		}

		const mediaList = await this.mediaRepository.findByIds(uniqueIds);
		if (mediaList.length !== uniqueIds.length) {
			throw new HttpBadRequestError(ErrorCode.POST_MEDIA_NOT_FOUND);
		}

		for (const media of mediaList) {
			this.mediaUploadService.assertMediaReadyForPost(media, userId);
		}
	}

	private async validateTags(tags: PostTagRequestDto[]): Promise<void> {
		for (const tag of tags) {
			const label = tag.refLabel?.trim();
			if (!label) {
				throw new HttpBadRequestError(ErrorCode.POST_INVALID_TAG);
			}
		}

		const categoryIds = [
			...new Set(
				tags
					.filter((t) => t.tagType === PostTagType.CATEGORY && t.refId)
					.map((t) => t.refId!),
			),
		];
		if (categoryIds.length > 0) {
			const found = await this.categoryRepository.findByIds(categoryIds);
			const activeIds = new Set(
				found.filter((c) => c.isActive).map((c) => c.id),
			);
			if (categoryIds.some((id) => !activeIds.has(id))) {
				throw new HttpNotFoundError(ErrorCode.CATEGORY_NOT_FOUND);
			}
		}

		const productIds = [
			...new Set(
				tags
					.filter((t) => t.tagType === PostTagType.PRODUCT && t.refId)
					.map((t) => t.refId!),
			),
		];
		if (productIds.length > 0) {
			const found = await this.productRepository.findBy({
				id: In(productIds),
			});
			if (found.length !== productIds.length) {
				throw new HttpNotFoundError(ErrorCode.PRODUCT_NOT_FOUND);
			}
		}
	}

	private async getMediaIds(postId: string): Promise<string[]> {
		const rows = await this.postMediaRepository.find({
			where: { postId },
			order: { position: 'ASC' },
		});
		return rows.map((row) => row.mediaId);
	}

	private async replacePostMedia(
		manager: EntityManager,
		postId: string,
		mediaIds: string[],
	): Promise<void> {
		await manager.getRepository(PostMedia).delete({ postId });
		if (mediaIds.length === 0) return;

		const rows = mediaIds.map((mediaId, index) =>
			manager.getRepository(PostMedia).create({
				postId,
				mediaId,
				position: index,
			}),
		);
		await manager.getRepository(PostMedia).save(rows);
	}

	private async replacePostTags(
		manager: EntityManager,
		postId: string,
		tags: PostTagRequestDto[],
	): Promise<void> {
		await manager.getRepository(PostTag).delete({ postId });
		if (tags.length === 0) return;

		const rows = tags.map((tag) =>
			manager.getRepository(PostTag).create({
				postId,
				tagType: tag.tagType,
				refId: tag.refId ?? null,
				refLabel: tag.refLabel.trim(),
			}),
		);
		await manager.getRepository(PostTag).save(rows);
	}

	private async replacePostHashtags(
		manager: EntityManager,
		postId: string,
		body: string | null | undefined,
	): Promise<void> {
		const nextTags = parseHashtagsFromBody(body);
		if (nextTags.length > MAX_HASHTAGS_PER_POST) {
			throw new HttpBadRequestError(ErrorCode.POST_HASHTAG_LIMIT_EXCEEDED);
		}

		const postHashtagRepo = manager.getRepository(PostHashtag);
		const hashtagRepo = manager.getRepository(Hashtag);

		const oldLinks = await postHashtagRepo.find({ where: { postId } });
		const oldHashtagIds = oldLinks.map((link) => link.hashtagId);

		await postHashtagRepo.delete({ postId });

		const newHashtagIds: string[] = [];
		for (const tag of nextTags) {
			const hashtag = await this.ensureHashtag(hashtagRepo, tag);
			await postHashtagRepo.save({ postId, hashtagId: hashtag.id });
			newHashtagIds.push(hashtag.id);
		}

		const removed = oldHashtagIds.filter((id) => !newHashtagIds.includes(id));
		const added = newHashtagIds.filter((id) => !oldHashtagIds.includes(id));

		await this.adjustHashtagPostCounts(manager, removed, -1);
		await this.adjustHashtagPostCounts(manager, added, 1);
	}

	private async ensureHashtag(
		hashtagRepo: Repository<Hashtag>,
		tag: string,
	): Promise<Hashtag> {
		const existing = await hashtagRepo.findOne({ where: { tag } });
		if (existing) {
			return existing;
		}

		try {
			return await hashtagRepo.save(hashtagRepo.create({ tag, postCount: 0 }));
		} catch (error) {
			if (this.isUniqueViolation(error)) {
				const row = await hashtagRepo.findOne({ where: { tag } });
				if (row) {
					return row;
				}
			}
			throw error;
		}
	}

	private async adjustHashtagPostCounts(
		manager: EntityManager,
		hashtagIds: string[],
		delta: 1 | -1,
	): Promise<void> {
		const uniqueIds = [...new Set(hashtagIds)];
		if (uniqueIds.length === 0) {
			return;
		}

		const hashtagRepo = manager.getRepository(Hashtag);
		if (delta === 1) {
			await hashtagRepo
				.createQueryBuilder()
				.update(Hashtag)
				.set({ postCount: () => 'post_count + 1' })
				.where('id IN (:...ids)', { ids: uniqueIds })
				.execute();
			return;
		}

		await hashtagRepo
			.createQueryBuilder()
			.update(Hashtag)
			.set({ postCount: () => 'GREATEST(0, post_count - 1)' })
			.where('id IN (:...ids)', { ids: uniqueIds })
			.execute();
	}

	private isUniqueViolation(error: unknown): boolean {
		if (!(error instanceof QueryFailedError)) {
			return false;
		}

		const driverError = error.driverError as { code?: string } | undefined;
		return driverError?.code === '23505';
	}

	async toDetailViewForViewer(
		input: {
			post: Post;
			postMedia?: PostMedia[];
			postTags?: PostTag[];
			postHashtags?: PostHashtag[];
			profile?: Profile | null;
		},
		viewerId?: string,
	) {
		const view = this.toDetailView(input);

		const [reactionBreakdown, viewerReaction, originalPost] = await Promise.all(
			[
				this.reactionRepository.getBreakdownForTarget(
					ReactionTargetType.POST,
					input.post.id,
				),
				viewerId
					? this.reactionRepository.getViewerReaction(
							ReactionTargetType.POST,
							input.post.id,
							viewerId,
						)
					: Promise.resolve(null),
				this.extractOriginalPostId(input.post)
					? this.loadOriginalPostView(
							this.extractOriginalPostId(input.post)!,
							viewerId,
						)
					: Promise.resolve(undefined),
			],
		);

		return {
			...view,
			reactionBreakdown,
			viewerHasReacted: viewerReaction !== null,
			viewerReaction,
			...(originalPost !== undefined && { originalPost }),
		};
	}

	toDetailView(input: {
		post: Post;
		postMedia?: PostMedia[];
		postTags?: PostTag[];
		postHashtags?: PostHashtag[];
		profile?: Profile | null;
	}) {
		const { post } = input;
		const postMediaRows = input.postMedia ?? post.postMedia ?? [];
		const tags = input.postTags ?? post.postTags ?? [];
		const hashtagLinks = input.postHashtags ?? post.postHashtags ?? [];
		const profile = input.profile ?? post.author?.profile ?? null;
		return {
			id: post.id,
			authorId: post.authorId,
			body: post.body,
			visibility: post.visibility,
			category: post.category,
			isEdited: post.isEdited,
			reactionCount: post.reactionCount,
			reactionBreakdown: {},
			viewerHasReacted: false,
			viewerReaction: null,
			commentCount: post.commentCount,
			shareCount: post.shareCount,
			viewCount: post.viewCount,
			createdAt: post.createdAt,
			updatedAt: post.updatedAt,
			source: post.source,
			sourceMetadata: post.sourceMetadata,
			author: {
				userId: post.authorId,
				displayName: profile?.displayName ?? '',
				isVerified: profile?.isVerified ?? false,
				avatarMedia: profile?.avatarMedia
					? { cdnUrl: profile.avatarMedia.cdnUrl }
					: null,
			},
			media: [...postMediaRows]
				.sort((a, b) => a.position - b.position)
				.filter((row) => row.media)
				.map((row) => ({
					id: row.media.id,
					cdnUrl: row.media.cdnUrl,
					mimeType: row.media.mimeType,
					position: row.position,
					widthPx: row.media.widthPx,
					heightPx: row.media.heightPx,
				})),
			tags: tags.map((tag) => ({
				tagType: tag.tagType as PostTagType,
				refId: tag.refId,
				refLabel: tag.refLabel,
			})),
			hashtags: hashtagLinks
				.map((link) => link.hashtag?.tag)
				.filter((tag): tag is string => Boolean(tag))
				.sort((a, b) => a.localeCompare(b, 'vi-VN')),
		};
	}

	private async loadPostDetail(postId: string, viewerId?: string) {
		const post = await this.postRepository.findById(postId);
		if (!post) {
			throw new HttpNotFoundError(ErrorCode.POST_NOT_FOUND);
		}

		const [postMediaRows, tags, hashtagLinks, profile] = await Promise.all([
			this.postMediaRepository.find({
				where: { postId },
				relations: ['media'],
				order: { position: 'ASC' },
			}),
			this.postTagRepository.find({ where: { postId } }),
			this.postHashtagRepository.find({
				where: { postId },
				relations: { hashtag: true },
			}),
			this.loadAuthorProfile(post.authorId),
		]);

		return this.toDetailViewForViewer(
			{
				post,
				postMedia: postMediaRows,
				postTags: tags,
				postHashtags: hashtagLinks,
				profile,
			},
			viewerId,
		);
	}

	private extractOriginalPostId(post: Post): string | null {
		if (post.source !== PostSource.REPOST) {
			return null;
		}

		const originalPostId = post.sourceMetadata?.originalPostId;
		return typeof originalPostId === 'string' && originalPostId.length > 0
			? originalPostId
			: null;
	}

	private async loadOriginalPostView(
		originalPostId: string,
		viewerId?: string,
	) {
		const original = await this.postRepository.findById(originalPostId);
		if (!original) {
			return null;
		}

		try {
			await this.assertCanViewPost(original, viewerId);
		} catch {
			return null;
		}

		const [postMediaRows, tags, hashtagLinks, profile] = await Promise.all([
			this.postMediaRepository.find({
				where: { postId: originalPostId },
				relations: ['media'],
				order: { position: 'ASC' },
			}),
			this.postTagRepository.find({ where: { postId: originalPostId } }),
			this.postHashtagRepository.find({
				where: { postId: originalPostId },
				relations: { hashtag: true },
			}),
			this.loadAuthorProfile(original.authorId),
		]);

		return this.toDetailView({
			post: original,
			postMedia: postMediaRows,
			postTags: tags,
			postHashtags: hashtagLinks,
			profile,
		});
	}

	private async loadAuthorProfile(userId: string): Promise<Profile | null> {
		return this.profileRepository.findOne({ userId }, ['avatarMedia']);
	}
}
