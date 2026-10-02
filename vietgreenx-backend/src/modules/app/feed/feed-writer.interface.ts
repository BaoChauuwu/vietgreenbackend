/**
 * IFeedWriter — contract for the V2 fanout layer.
 *
 * V1: no-op implementation (feed is pull-only from DB + Redis cache).
 * V2: Redis ZADD fanout — on post.created, push postId into each
 *     follower's sorted-set timeline (score = unix timestamp).
 *     Accounts with > FANOUT_THRESHOLD followers use pull instead
 *     (hybrid fanout, same pattern as Twitter's timeline service).
 *
 * FeedService depends on this interface, not on any concrete class,
 * so the implementation can be swapped without touching business logic.
 */
export interface IFeedWriter {
	/**
	 * Propagate a newly created post into the timelines of the author's followers.
	 * Implementations must be idempotent and must not throw — failures are
	 * logged and swallowed so a fanout error never fails the create-post request.
	 */
	writePostToFollowerFeeds(postId: string, authorId: string): Promise<void>;
}

export const FEED_WRITER = Symbol('IFeedWriter');
