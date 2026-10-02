import { Injectable } from '@nestjs/common';
import { FeedQueryDto } from './dto/requests/feed.query.dto';
import { PostRepository } from '@app/database/typeorm/repositories/post.repository';
import { ProfileRepository } from '@app/database/typeorm/repositories/profile.repository';
import { VisibilityType } from '@app/common/enums/visibility-type.enum';
import { FeedMode } from '@app/common/enums/feed-mode.enum';
import { Follow } from '@app/database/typeorm/entities/social-graph/follow.entity';
import { Post } from '@app/database/typeorm/entities/content/post.entity';
import { Profile } from '@app/database/typeorm/entities/identity/profile.entity';
import { PostService } from '@app/modules/app/post/post.service';
import { BlockService } from '@app/modules/app/block/block.service';
import { Brackets, In } from 'typeorm';
import { FollowStatus } from '@app/common/enums/follow-status.enum';
import { RedisService } from '@app/services/redis/redis.service';
import { CacheKeys, CacheTtl } from '@app/common/constants/cache-keys';

const DISCOVERY_LIMIT = 30;
const DISCOVERY_WINDOW_DAYS = 7;

@Injectable()
export class FeedService {
	constructor(
		private readonly postRepository: PostRepository,
		private readonly profileRepository: ProfileRepository,
		private readonly postService: PostService,
		private readonly blockService: BlockService,
		private readonly redis: RedisService,
	) {}

	private async buildProfileMap(posts: Post[]): Promise<Map<string, Profile>> {
		const authorIds = [...new Set(posts.map((p) => p.authorId))];
		if (authorIds.length === 0) return new Map();
		const profiles = await this.profileRepository.findAll({
			where: { userId: In(authorIds) } as any,
			relations: ['avatarMedia'],
		});
		return new Map(profiles.map((p) => [p.userId, p]));
	}

	async getFeed(userId: string, query: FeedQueryDto) {
		if (query.q && query.q.trim().length > 0) {
			return this.querySearch(userId, query);
		}

		const mode = query.mode ?? FeedMode.DISCOVERY;

		if (mode === FeedMode.DISCOVERY) {
			const key = CacheKeys.feedDiscovery(userId);
			return this.redis.getOrSet(key, CacheTtl.FEED_DISCOVERY_SECONDS, () =>
				this.queryDiscovery(userId, query),
			);
		}

		// Following mode: only cache the first page.
		// Subsequent pages are not cached — marginal hit rate does not justify the
		// per-cursor key space and the associated invalidation complexity.
		const cursor = query.cursor || undefined;

		if (!cursor) {
			const key = CacheKeys.feedFollowing(userId);
			return this.redis.getOrSet(key, CacheTtl.FEED_FOLLOWING_SECONDS, () =>
				this.queryFollowing(userId, { ...query, cursor }),
			);
		}

		return this.queryFollowing(userId, { ...query, cursor });
	}

	/**
	 * Discovery feed: top-30 public posts from the past 7 days ranked by the
	 * Hacker News gravity formula — engagement score divided by time decay.
	 *
	 * score = (reactions + comments*2 + shares*3) / (age_hours + 2)^1.5
	 *
	 * No cursor — score changes continuously so stable pagination is not
	 * possible without snapshotting. Returns a fixed window of the best posts.
	 */
	private async queryDiscovery(userId: string, query: FeedQueryDto) {
		const blockedUserIds = await this.blockService.getBlockedUserIds(userId);

		const qb = this.postRepository
			.createQueryBuilder('post')
			.leftJoinAndSelect('post.postMedia', 'postMedia')
			.leftJoinAndSelect('postMedia.media', 'media')
			.leftJoinAndSelect('post.postHashtags', 'postHashtags')
			.leftJoinAndSelect('postHashtags.hashtag', 'hashtag')
			.leftJoinAndSelect('post.postTags', 'postTags')
			.where('post.isDraft = :isDraft', { isDraft: false })
			.andWhere(
				new Brackets((bqb) => {
					bqb
						.where('post.authorId = :userId', { userId })
						.orWhere('post.visibility = :visibility', {
							visibility: VisibilityType.PUBLIC,
						});
				}),
			)
			.andWhere(
				`post.createdAt >= NOW() - INTERVAL '${DISCOVERY_WINDOW_DAYS} days'`,
			)
			.addSelect(
				`(post.reaction_count + post.comment_count * 2 + post.share_count * 3)
				/ POWER(EXTRACT(EPOCH FROM (NOW() - post.created_at)) / 3600 + 2, 1.5)`,
				'score',
			)
			.orderBy('score', 'DESC')
			.addOrderBy('post.createdAt', 'DESC')
			.take(DISCOVERY_LIMIT);

		if (blockedUserIds.length > 0) {
			qb.andWhere('post.authorId NOT IN (:...blockedUserIds)', {
				blockedUserIds,
			});
		}

		if (query.category) {
			qb.andWhere('post.category = :category', { category: query.category });
		}

		const posts = await qb.getMany();
		const profileMap = await this.buildProfileMap(posts);
		const items = await Promise.all(
			posts.map((post) =>
				this.postService.toDetailViewForViewer(
					{ post, profile: profileMap.get(post.authorId) ?? null },
					userId,
				),
			),
		);

		return { items, nextCursor: null, hasNext: false, limit: DISCOVERY_LIMIT };
	}

	/**
	 * Following feed: chronological posts from followed users and orgs.
	 * Includes the viewer's own posts so their timeline feels complete.
	 * Only the first page is cached; subsequent pages are fetched live.
	 */
	private async queryFollowing(
		userId: string,
		query: FeedQueryDto & { cursor?: string },
	) {
		const limit = query.limit ?? 20;
		const blockedUserIds = await this.blockService.getBlockedUserIds(userId);

		const qb = this.postRepository
			.createQueryBuilder('post')
			.leftJoinAndSelect('post.postMedia', 'postMedia')
			.leftJoinAndSelect('postMedia.media', 'media')
			.leftJoinAndSelect('post.postHashtags', 'postHashtags')
			.leftJoinAndSelect('postHashtags.hashtag', 'hashtag')
			.leftJoinAndSelect('post.postTags', 'postTags')
			.where('post.isDraft = :isDraft', { isDraft: false })
			.andWhere(
				new Brackets((bqb) => {
					bqb
						.where((subQb) => {
							const sub = subQb
								.subQuery()
								.select('f.followee_user_id')
								.from(Follow, 'f')
								.where('f.followerId = :userId')
								.andWhere('f.followeeUserId IS NOT NULL')
								.andWhere('f.status = :followStatus')
								.getQuery();
							return `(
								post.author_id IN ${sub}
								AND post.org_id IS NULL
								AND (
									post.visibility = :public
									OR post.visibility = :followersOnly
								)
							)`;
						})
						.orWhere((subQb) => {
							const sub = subQb
								.subQuery()
								.select('f.followee_org_id')
								.from(Follow, 'f')
								.where('f.followerId = :userId')
								.andWhere('f.followeeOrgId IS NOT NULL')
								.andWhere('f.status = :followStatus')
								.getQuery();
							return `(
								post.org_id IN ${sub}
								AND (
									post.visibility = :public
									OR post.visibility = :followersOnly
								)
							)`;
						})
						.orWhere('post.authorId = :userId');
				}),
				{
					userId,
					followStatus: FollowStatus.ACTIVE,
					public: VisibilityType.PUBLIC,
					followersOnly: VisibilityType.FOLLOWERS_ONLY,
				},
			);

		if (blockedUserIds.length > 0) {
			qb.andWhere('post.authorId NOT IN (:...blockedUserIds)', {
				blockedUserIds,
			});
		}

		if (query.category) {
			qb.andWhere('post.category = :category', { category: query.category });
		}

		qb.orderBy('post.createdAt', 'DESC').addOrderBy('post.id', 'DESC');

		const result = await this.postRepository.paginateWithCursor(
			qb,
			['createdAt', 'id'],
			query.cursor,
			limit,
		);

		const profileMap = await this.buildProfileMap(result.data);
		const items = await Promise.all(
			result.data.map((post) =>
				this.postService.toDetailViewForViewer(
					{ post, profile: profileMap.get(post.authorId) ?? null },
					userId,
				),
			),
		);

		return {
			items,
			nextCursor: result.nextCursor ?? null,
			hasNext: result.hasNext,
			limit: result.limit,
		};
	}

	/**
	 * Search feed: full-text match on post body across all public posts + own posts.
	 * Ignores mode, category, and discovery scoring — results are chronological.
	 */
	private async querySearch(userId: string, query: FeedQueryDto) {
		const limit = query.limit ?? 20;
		const blockedUserIds = await this.blockService.getBlockedUserIds(userId);
		const term = `%${query.q!.trim()}%`;

		const qb = this.postRepository
			.createQueryBuilder('post')
			.leftJoinAndSelect('post.postMedia', 'postMedia')
			.leftJoinAndSelect('postMedia.media', 'media')
			.leftJoinAndSelect('post.postHashtags', 'postHashtags')
			.leftJoinAndSelect('postHashtags.hashtag', 'hashtag')
			.leftJoinAndSelect('post.postTags', 'postTags')
			.where('post.isDraft = :isDraft', { isDraft: false })
			.andWhere('post.body ILIKE :term', { term })
			.andWhere(
				new Brackets((bqb) => {
					bqb
						.where('post.authorId = :userId', { userId })
						.orWhere('post.visibility = :visibility', {
							visibility: VisibilityType.PUBLIC,
						});
				}),
			)
			.orderBy('post.createdAt', 'DESC')
			.addOrderBy('post.id', 'DESC');

		if (blockedUserIds.length > 0) {
			qb.andWhere('post.authorId NOT IN (:...blockedUserIds)', {
				blockedUserIds,
			});
		}

		const result = await this.postRepository.paginateWithCursor(
			qb,
			['createdAt', 'id'],
			query.cursor,
			limit,
		);

		const profileMap = await this.buildProfileMap(result.data);
		const items = await Promise.all(
			result.data.map((post) =>
				this.postService.toDetailViewForViewer(
					{ post, profile: profileMap.get(post.authorId) ?? null },
					userId,
				),
			),
		);

		return {
			items,
			nextCursor: result.nextCursor ?? null,
			hasNext: result.hasNext,
			limit: result.limit,
		};
	}
}
