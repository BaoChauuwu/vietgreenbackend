/**
 * Centralised cache-key builders and TTL constants.
 *
 * Naming convention: cache:{domain}:{qualifier}
 * All keys are functions to enforce parameterisation — no ad-hoc string
 * interpolation scattered across services.
 */
export const CacheKeys = {
	/**
	 * Discovery feed page, global across users.
	 * Keyed by viewer because toDetailViewForViewer may include viewer-specific
	 * originalPost data for share-type posts.
	 */
	/** Per-viewer discovery feed (no cursor — fixed top-30 window). */
	feedDiscovery: (userId: string): string => `cache:feed:discovery:${userId}`,

	/** Glob pattern that matches every viewer's discovery cache entry. */
	feedDiscoveryPattern: (): string => `cache:feed:discovery:*`,

	/**
	 * Following feed — ONLY the first page (cursor = null).
	 * Subsequent pages are not cached: the marginal gain is too small relative
	 * to the invalidation complexity that per-cursor following caches would require.
	 */
	feedFollowing: (userId: string): string => `cache:feed:following:${userId}`,

	/**
	 * Mutual block list for a user.
	 * Invalidated on every block / unblock action for both participants.
	 */
	blockList: (userId: string): string => `cache:block-list:${userId}`,

	/**
	 * Public profile for a user. Viewer-agnostic — the block check runs
	 * before this cache is consulted so the stored value is always safe to
	 * serve to any viewer who passes the check.
	 * Invalidated immediately when the user updates their own profile.
	 */
	profile: (userId: string): string => `cache:profile:${userId}`,

	/**
	 * Trending feed — top-N public posts by engagement, no cursor.
	 * Short TTL is intentional: reaction/comment counts change frequently
	 * and we want the ranking to feel reasonably fresh.
	 */
	feedTrending: (userId: string, limit: number): string =>
		`cache:feed:trending:${userId}:${limit}`,
} as const;

/**
 * TTL values in seconds.
 * Keep these short enough that stale data is never business-critical, but
 * long enough to absorb burst traffic (e.g., app open → rapid scrolling).
 */
export const CacheTtl = {
	/**
	 * 30 s: discovery feed. New public posts become visible within one TTL
	 * window — acceptable for a social feed. No explicit invalidation needed.
	 */
	FEED_DISCOVERY_SECONDS: 30,

	/**
	 * 60 s: following feed first page. Explicitly deleted on follow/unfollow
	 * and block/unblock so the user sees up-to-date content after those actions.
	 */
	FEED_FOLLOWING_SECONDS: 60,

	/**
	 * 5 min: block list. Longer TTL is safe because block/unblock operations
	 * also delete the cache entry immediately.
	 */
	BLOCK_LIST_SECONDS: 300,

	/**
	 * 5 min: user profile. Invalidated immediately on profile update, so a
	 * longer TTL is safe — stale data only persists if the invalidation fails.
	 */
	PROFILE_SECONDS: 300,
} as const;
