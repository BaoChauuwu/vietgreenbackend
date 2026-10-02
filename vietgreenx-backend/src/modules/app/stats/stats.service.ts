import { Injectable, Logger } from '@nestjs/common';
import { UserRepository } from '@app/database/typeorm/repositories/user.repository';
import { QrScanRepository } from '@app/database/typeorm/repositories/qr-scan.repository';
import { RedisService } from '@app/services/redis/redis.service';

@Injectable()
export class StatsService {
	private readonly logger = new Logger(StatsService.name);
	private readonly CACHE_KEY = 'public_stats';
	private readonly CACHE_TTL_SECONDS = 600;

	constructor(
		private readonly userRepository: UserRepository,
		private readonly qrScanRepository: QrScanRepository,
		private readonly redisService: RedisService,
	) {}

	async invalidatePublicStatsCache(): Promise<void> {
		try {
			await this.redisService.del(this.CACHE_KEY);
		} catch (err) {
			this.logger.warn('Failed to invalidate public stats cache', err);
		}
	}

	async getPublicStats(): Promise<{ userCount: number; qrScanCount: number }> {
		try {
			const cachedData = await this.redisService.get(this.CACHE_KEY);
			if (cachedData) {
				this.logger.debug('Fetching public stats from Redis cache');
				const parsed = JSON.parse(cachedData);
				if (
					typeof parsed?.userCount === 'number' &&
					typeof parsed?.qrScanCount === 'number'
				) {
					return parsed;
				}
			}
		} catch (err) {
			this.logger.warn('Failed to retrieve public stats from Redis cache', err);
		}

		this.logger.debug('Fetching public stats from Database');
		const userCount = await this.userRepository.countActiveUsers();
		const qrScanCount = await this.qrScanRepository.count();

		const stats = { userCount, qrScanCount };

		try {
			await this.redisService.set(
				this.CACHE_KEY,
				JSON.stringify(stats),
				this.CACHE_TTL_SECONDS,
			);
		} catch (err) {
			this.logger.warn('Failed to cache public stats in Redis', err);
		}

		return stats;
	}
}
