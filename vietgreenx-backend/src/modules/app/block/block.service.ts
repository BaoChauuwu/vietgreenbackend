import { Injectable } from '@nestjs/common';
import { BlockRepository } from '@app/database/typeorm/repositories/block.repository';
import { UserRepository } from '@app/database/typeorm/repositories/user.repository';
import { Block } from '@app/database/typeorm/entities/social-graph/block.entity';
import { Follow } from '@app/database/typeorm/entities/social-graph/follow.entity';
import { PaginationDto } from '@app/common/dtos/paginationDto';
import { Pagination } from '@app/common/types/request-response.type';
import { HttpBadRequestError } from '@app/common/errors/bad-request.error';
import { HttpNotFoundError } from '@app/common/errors/not-found.error';
import { ErrorCode } from '@app/common/errors/error-code';
import { RedisService } from '@app/services/redis/redis.service';
import { CacheKeys, CacheTtl } from '@app/common/constants/cache-keys';

@Injectable()
export class BlockService {
	constructor(
		private readonly blockRepository: BlockRepository,
		private readonly userRepository: UserRepository,
		private readonly redis: RedisService,
	) {}

	/**
	 * Hot path: called on every feed request.
	 * Cached for BLOCK_LIST_SECONDS; invalidated eagerly on block/unblock.
	 */
	async getBlockedUserIds(userId: string): Promise<string[]> {
		return this.redis.getOrSet(
			CacheKeys.blockList(userId),
			CacheTtl.BLOCK_LIST_SECONDS,
			() => this.blockRepository.findMutuallyBlockedUserIds(userId),
		);
	}

	async isEitherBlocked(userIdA: string, userIdB: string): Promise<boolean> {
		return this.blockRepository.existsEitherDirection(userIdA, userIdB);
	}

	async blockUser(blockerId: string, blockedUserId: string): Promise<Block> {
		if (blockerId === blockedUserId) {
			throw new HttpBadRequestError(ErrorCode.CANNOT_BLOCK_SELF);
		}

		const blockedUser = await this.userRepository.findOne({
			id: blockedUserId,
		});
		if (!blockedUser) {
			throw new HttpNotFoundError(ErrorCode.USER_NOT_FOUND);
		}

		const existing = await this.blockRepository.findByBlockerAndBlocked(
			blockerId,
			blockedUserId,
		);
		if (existing) {
			throw new HttpBadRequestError(ErrorCode.USER_ALREADY_BLOCKED);
		}

		const blockId = await this.blockRepository.executeInTransaction(
			async (manager) => {
				const block = await manager.getRepository(Block).save(
					manager.getRepository(Block).create({
						blockerId,
						blockedId: blockedUserId,
					}),
				);

				await manager
					.createQueryBuilder()
					.delete()
					.from(Follow)
					.where(
						'(follower_id = :blockerId AND followee_user_id = :blockedUserId) OR (follower_id = :blockedUserId AND followee_user_id = :blockerId)',
						{ blockerId, blockedUserId },
					)
					.execute();

				return block.id;
			},
		);

		// Invalidate BEFORE the reload so the cache is always cleared regardless
		// of whether the subsequent findOne succeeds. If invalidation ran after,
		// a findOne failure would leave stale block-list / feed caches for up to TTL.
		await Promise.allSettled([
			this.redis.del(CacheKeys.blockList(blockerId)),
			this.redis.del(CacheKeys.blockList(blockedUserId)),
			this.redis.del(CacheKeys.feedFollowing(blockerId)),
			this.redis.del(CacheKeys.feedFollowing(blockedUserId)),
			this.redis.del(CacheKeys.feedDiscovery(blockerId)),
		]);

		const block = await this.blockRepository.findOne({ id: blockId }, [
			'blocked',
			'blocked.profile',
			'blocked.profile.avatarMedia',
		]);

		// findOne should never return null here — blockId was just written in the
		// transaction above — but guard explicitly to avoid a runtime spread-of-null crash.
		if (!block) {
			throw new HttpNotFoundError(ErrorCode.BLOCK_NOT_FOUND);
		}

		return {
			...block,
			blockedUserId: block.blockedId,
			blockedUser: block.blocked,
		} as Block & { blockedUserId: string; blockedUser: Block['blocked'] };
	}

	async unblockUser(blockerId: string, blockedUserId: string): Promise<void> {
		const deleted = await this.blockRepository.delete({
			blockerId,
			blockedId: blockedUserId,
		});

		if (!deleted) {
			throw new HttpNotFoundError(ErrorCode.BLOCK_NOT_FOUND);
		}

		// After unblock both users may start seeing each other's content again.
		await Promise.allSettled([
			this.redis.del(CacheKeys.blockList(blockerId)),
			this.redis.del(CacheKeys.blockList(blockedUserId)),
			this.redis.del(CacheKeys.feedFollowing(blockerId)),
			this.redis.del(CacheKeys.feedFollowing(blockedUserId)),
			this.redis.del(CacheKeys.feedDiscovery(blockerId)),
		]);
	}

	async listBlockedUsers(
		blockerId: string,
		paginationDto: PaginationDto,
	): Promise<
		Pagination<Block & { blockedUserId: string; blockedUser: Block['blocked'] }>
	> {
		const result = await this.blockRepository.findWithPagination(
			paginationDto.page,
			paginationDto.limit,
			{
				where: { blockerId },
				relations: [
					'blocked',
					'blocked.profile',
					'blocked.profile.avatarMedia',
				],
				order: { createdAt: 'DESC' },
			},
		);

		return {
			...result,
			items: result.items.map((block) => ({
				...block,
				blockedUserId: block.blockedId,
				blockedUser: block.blocked,
			})),
		};
	}
}
