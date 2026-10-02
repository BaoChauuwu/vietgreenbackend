import {
	Injectable,
	OnModuleDestroy,
	OnModuleInit,
	Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { ConfigKeys } from '@app/config/config-key.enum';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
	private client: Redis;
	private readonly logger = new Logger(RedisService.name);

	constructor(private readonly configService: ConfigService) {}

	onModuleInit() {
		this.client = new Redis({
			host:
				this.configService.get<string>(ConfigKeys.REDIS_HOST) ?? 'localhost',
			port: this.configService.get<number>(ConfigKeys.REDIS_PORT) ?? 6379,
			lazyConnect: true,
		});

		this.client.on('error', (err) => {
			this.logger.error('Redis connection error', err.message);
		});

		this.client.on('connect', () => {
			this.logger.log('Redis connected');
		});
	}

	onModuleDestroy() {
		this.client?.disconnect();
	}

	async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
		// `if (ttlSeconds)` would silently treat 0 as "no TTL" — an infinite key.
		// Use an explicit positive check so callers cannot accidentally create
		// non-expiring cache entries by passing 0.
		if (ttlSeconds !== undefined && ttlSeconds > 0) {
			await this.client.set(key, value, 'EX', ttlSeconds);
		} else {
			await this.client.set(key, value);
		}
	}

	async get(key: string): Promise<string | null> {
		return this.client.get(key);
	}

	async del(key: string): Promise<void> {
		await this.client.del(key);
	}

	async incr(key: string): Promise<number> {
		return this.client.incr(key);
	}

	async expire(key: string, ttlSeconds: number): Promise<void> {
		await this.client.expire(key, ttlSeconds);
	}

	async ttl(key: string): Promise<number> {
		return this.client.ttl(key);
	}

	async exists(key: string): Promise<boolean> {
		const result = await this.client.exists(key);
		return result === 1;
	}

	async setNx(
		key: string,
		value: string,
		ttlSeconds: number,
	): Promise<boolean> {
		const result = await this.client.set(key, value, 'EX', ttlSeconds, 'NX');
		return result === 'OK';
	}

	async incrWithTtlOnce(key: string, ttlSeconds: number): Promise<number> {
		const script = `
			local count = redis.call('INCR', KEYS[1])
			if count == 1 then
				redis.call('EXPIRE', KEYS[1], ARGV[1])
			end
			return count
		`;
		const result = await this.client.eval(script, 1, key, ttlSeconds);
		return result as number;
	}

	/**
	 * Cache-aside helper.
	 *
	 * Failure modes handled explicitly:
	 *  - Redis read error  → fall through to fetcher; fetcher called once only
	 *  - JSON parse error  → fall through to fetcher (stale / corrupt entry)
	 *  - fetcher undefined → skip write; undefined is not a valid Redis value
	 *  - JSON.stringify throw (circular ref, BigInt) → logged, write skipped
	 *  - Redis write error → logged; never blocks the API response
	 *  - Fetcher error     → propagates naturally; write is never reached
	 *
	 * Date fields in cached objects are serialised as ISO strings.
	 * Callers that return response-only DTOs are unaffected; callers that
	 * return TypeORM entities for further processing should convert dates
	 * to ISO strings before caching.
	 */
	async getOrSet<T>(
		key: string,
		ttlSeconds: number,
		fetcher: () => Promise<T>,
	): Promise<T> {
		let raw: string | null = null;

		try {
			raw = await this.client.get(key);
		} catch (err) {
			this.logger.warn(
				`Cache read failed for "${key}": ${err instanceof Error ? err.message : String(err)}`,
			);
			return fetcher();
		}

		if (raw !== null) {
			try {
				return JSON.parse(raw) as T;
			} catch {
				this.logger.warn(
					`Cache parse error for "${key}" — fetching fresh value`,
				);
			}
		}

		const value = await fetcher();

		// Skip write for undefined: JSON.stringify(undefined) returns the JS
		// value `undefined`, not a string, which ioredis coerces to "undefined"
		// and corrupts every subsequent cache read.
		if (value === undefined) {
			return value;
		}

		// Wrap JSON.stringify inside the microtask so a circular-reference or
		// BigInt throw is caught by the same .catch() that handles Redis errors.
		// Without this, a synchronous throw escapes the fire-and-forget entirely
		// and surfaces as an unhandled 500 to the caller.
		Promise.resolve()
			.then(() => this.set(key, JSON.stringify(value), ttlSeconds))
			.catch((err) => {
				this.logger.warn(
					`Cache write failed for "${key}": ${err instanceof Error ? err.message : String(err)}`,
				);
			});

		return value;
	}

	/**
	 * Delete multiple keys in a single round-trip.
	 * Silently no-ops on an empty array.
	 */
	async delMany(keys: string[]): Promise<void> {
		if (keys.length === 0) return;
		await this.client.del(...keys);
	}

	/**
	 * Delete all keys matching a glob pattern using non-blocking SCAN.
	 * Use only for cache eviction — never on hot paths.
	 */
	async delPattern(pattern: string): Promise<void> {
		let cursor = '0';
		do {
			const [nextCursor, keys] = await this.client.scan(
				cursor,
				'MATCH',
				pattern,
				'COUNT',
				100,
			);
			cursor = nextCursor;
			if (keys.length > 0) {
				await this.client.del(...keys);
			}
		} while (cursor !== '0');
	}

	async checkAndIncrAttempt(
		attemptKey: string,
		otpKey: string,
		maxAttempts: number,
	): Promise<'ok' | 'exceeded'> {
		const script = `
			local current = redis.call('GET', KEYS[1])
			local count = current and tonumber(current) or 0
			if count >= tonumber(ARGV[1]) then
				return 'exceeded'
			end
			local newCount = redis.call('INCR', KEYS[1])
			if newCount == 1 then
				local remaining = redis.call('TTL', KEYS[2])
				if remaining and remaining > 0 then
					redis.call('EXPIRE', KEYS[1], remaining)
				end
			end
			return 'ok'
		`;
		const result = await this.client.eval(
			script,
			2,
			attemptKey,
			otpKey,
			maxAttempts,
		);
		return result as 'ok' | 'exceeded';
	}
}
