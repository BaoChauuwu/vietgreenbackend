export const createMockRedisService = () => ({
	set: jest.fn().mockResolvedValue(undefined),
	get: jest.fn().mockResolvedValue(null),
	del: jest.fn().mockResolvedValue(undefined),
	incr: jest.fn().mockResolvedValue(1),
	expire: jest.fn().mockResolvedValue(undefined),
	ttl: jest.fn().mockResolvedValue(-1),
	exists: jest.fn().mockResolvedValue(false),
	incrWithTtlOnce: jest.fn().mockResolvedValue(1),
	checkAndIncrAttempt: jest.fn().mockResolvedValue('ok'),
});

export type MockRedisService = ReturnType<typeof createMockRedisService>;
