import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { Share } from '@app/database/typeorm/entities/engagement/share.entity';
import { Post } from '@app/database/typeorm/entities/content/post.entity';
import { VisibilityType } from '@app/common/enums/visibility-type.enum';
import { ShareType } from '@app/common/enums/share-type.enum';
import { PostSource } from '@app/common/enums/post-source.enum';
import { CreateShareRequestDto } from './dto/requests/create-share.request.dto';
import { HttpNotFoundError } from '@app/common/errors/not-found.error';
import { HttpBadRequestError } from '@app/common/errors/bad-request.error';
import { ErrorCode } from '@app/common/errors/error-code';
import { PostService } from '@app/modules/app/post/post.service';
import { PostRepository } from '@app/database/typeorm/repositories/post.repository';
import { User } from '@app/database/typeorm/entities/identity/user.entity';
import { capVisibility } from '@app/common/utils/cap-visibility';

@Injectable()
export class ShareService {
	constructor(
		private readonly postRepository: PostRepository,
		private readonly postService: PostService,
		@InjectRepository(Share)
		private readonly shareRepository: Repository<Share>,
	) {}

	async create(user: User, dto: CreateShareRequestDto) {
		const post = await this.postRepository.findById(dto.postId);
		if (!post) {
			throw new HttpNotFoundError(ErrorCode.POST_NOT_FOUND);
		}

		await this.postService.assertCanViewPost(post, user.id);

		const shareType = dto.shareType ?? ShareType.REPOST;
		const isRepost = shareType === ShareType.REPOST;

		if (isRepost) {
			this.postService.assertPostBodyOrMedia(dto.caption, []);
		}

		const result = await this.postRepository.executeInTransaction(
			async (manager) => {
				if (isRepost) {
					await this.assertNoDuplicateRepost(user.id, dto.postId, manager);
				}

				let share: Share;
				try {
					share = await manager.getRepository(Share).save(
						manager.getRepository(Share).create({
							userId: user.id,
							postId: dto.postId,
							caption: dto.caption ?? null,
							shareType,
						}),
					);
				} catch (err) {
					if (this.isUniqueViolation(err)) {
						throw new HttpBadRequestError(ErrorCode.POST_ALREADY_SHARED);
					}
					throw err;
				}

				let repostPostId: string | null = null;

				if (isRepost) {
					const body = dto.caption?.trim() || null;
					const requestedVisibility = dto.visibility ?? VisibilityType.PUBLIC;
					const visibility = capVisibility(
						requestedVisibility,
						post.visibility,
					);

					const repost = await manager.getRepository(Post).save(
						manager.getRepository(Post).create({
							authorId: user.id,
							body,
							visibility,
							isDraft: false,
							source: PostSource.REPOST,
							sourceMetadata: { originalPostId: dto.postId },
						}),
					);
					await this.postService.syncHashtagsInTransaction(
						manager,
						repost.id,
						body,
					);
					repostPostId = repost.id;
				}

				return {
					id: share.id,
					userId: share.userId,
					postId: share.postId,
					caption: share.caption,
					shareType: share.shareType,
					createdAt: share.createdAt,
					repostPostId,
				};
			},
		);

		if (result.repostPostId) {
			const repostPost = await this.postService.findOne(
				result.repostPostId,
				user.id,
			);
			return { ...result, repostPost };
		}

		return { ...result, repostPost: null };
	}

	private async assertNoDuplicateRepost(
		userId: string,
		postId: string,
		manager: import('typeorm').EntityManager,
	): Promise<void> {
		const existing = await manager.getRepository(Share).findOne({
			where: { userId, postId, shareType: ShareType.REPOST },
		});

		if (existing) {
			throw new HttpBadRequestError(ErrorCode.POST_ALREADY_SHARED);
		}
	}

	private isUniqueViolation(error: unknown): boolean {
		if (!(error instanceof QueryFailedError)) return false;
		const driverError = error.driverError as { code?: string } | undefined;
		return driverError?.code === '23505';
	}
}
