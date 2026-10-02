import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { RedisService } from '@app/services/redis/redis.service';
import { CacheKeys } from '@app/common/constants/cache-keys';
import { FollowCreatedEvent } from '../follow/events/follow-created.event';
import { FollowRemovedEvent } from '../follow/events/follow-removed.event';
import { PostCreatedEvent } from '../post/events/post-created.event';
import { ReactionCreatedEvent } from '../reaction/events/reaction-created.event';
import { ReactionRemovedEvent } from '../reaction/events/reaction-removed.event';
import { CommentCreatedEvent } from '../comment/events/comment-created.event';
import { CommentDeletedEvent } from '../comment/events/comment-deleted.event';

@Injectable()
export class FeedListener {
	private readonly logger = new Logger(FeedListener.name);

	constructor(private readonly redis: RedisService) {}

	/**
	 * When a user starts following someone, their following-feed first page is
	 * immediately stale — they should see the new followee's posts on next load.
	 */
	/**
	 * When a public post is published, both discovery and trending caches are
	 * immediately stale. Wipe them so the next reload fetches fresh data.
	 */
	@OnEvent('post.created', { async: true })
	async handlePostCreated(event: PostCreatedEvent): Promise<void> {
		try {
			await this.redis.delPattern(CacheKeys.feedDiscoveryPattern());
		} catch (err) {
			this.logger.warn(
				`Failed to invalidate feed caches on post.created (post ${event.post.id}): ${err instanceof Error ? err.message : String(err)}`,
			);
		}
	}

	/**
	 * When a user reacts or unreacts, their discovery cache is stale —
	 * viewerHasReacted for that post must reflect the new state immediately.
	 */
	@OnEvent('reaction.created', { async: true })
	async handleReactionCreated(event: ReactionCreatedEvent): Promise<void> {
		await this.invalidateDiscoveryFeed(event.userId, 'reaction.created');
	}

	@OnEvent('reaction.removed', { async: true })
	async handleReactionRemoved(event: ReactionRemovedEvent): Promise<void> {
		await this.invalidateDiscoveryFeed(event.userId, 'reaction.removed');
	}

	@OnEvent('comment.created', { async: true })
	async handleCommentCreated(event: CommentCreatedEvent): Promise<void> {
		await this.invalidateDiscoveryFeed(
			event.comment.authorId,
			'comment.created',
		);
	}

	@OnEvent('comment.deleted', { async: true })
	async handleCommentDeleted(event: CommentDeletedEvent): Promise<void> {
		await this.invalidateDiscoveryFeed(event.userId, 'comment.deleted');
	}

	@OnEvent('follow.created', { async: true })
	async handleFollowCreated(event: FollowCreatedEvent): Promise<void> {
		await this.invalidateFollowingFeed(
			event.follow.followerId,
			'follow.created',
		);
	}

	/**
	 * When a user unfollows, their following-feed first page is stale — posts
	 * from the unfollowed user should no longer appear.
	 */
	@OnEvent('follow.removed', { async: true })
	async handleFollowRemoved(event: FollowRemovedEvent): Promise<void> {
		await this.invalidateFollowingFeed(
			event.follow.followerId,
			'follow.removed',
		);
	}

	private async invalidateDiscoveryFeed(
		userId: string,
		reason: string,
	): Promise<void> {
		try {
			await Promise.all([
				this.redis.del(CacheKeys.feedDiscovery(userId)),
				this.redis.del(CacheKeys.feedFollowing(userId)),
			]);
		} catch (err) {
			this.logger.warn(
				`Failed to invalidate feed caches for user ${userId} (${reason}): ${err instanceof Error ? err.message : String(err)}`,
			);
		}
	}

	private async invalidateFollowingFeed(
		followerId: string,
		reason: string,
	): Promise<void> {
		try {
			await this.redis.del(CacheKeys.feedFollowing(followerId));
		} catch (err) {
			// Cache miss on invalidation is acceptable — TTL will clean it up.
			this.logger.warn(
				`Failed to invalidate following-feed cache for user ${followerId} (${reason}): ${err instanceof Error ? err.message : String(err)}`,
			);
		}
	}
}
