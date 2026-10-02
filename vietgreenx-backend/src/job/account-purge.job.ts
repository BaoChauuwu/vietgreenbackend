import { UserRepository } from '@app/database/typeorm/repositories/user.repository';
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { UserStatus } from '@app/common/enums/user-status.enum';
import { LessThan } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

import { ConfigKeys } from '@app/config/config-key.enum';
import { VerificationLevel } from '@app/common/enums/verification-level.enum';
import { User, Profile } from '@app/database/typeorm/entities';

const PURGE_CHUNK_SIZE = 100;

@Injectable()
export class AccountPurgeJob {
	private readonly logger = new Logger(AccountPurgeJob.name);
	constructor(
		private readonly userRepository: UserRepository,
		private readonly configService: ConfigService,
	) {}

	@Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
	async handleCron() {
		const purgeDays =
			this.configService.get<number>(ConfigKeys.ACCOUNT_PURGE_DAYS) ?? 30;
		const thresholdDate = new Date();
		thresholdDate.setDate(thresholdDate.getDate() - Number(purgeDays));

		let successCount = 0;
		let totalProcessed = 0;
		let page = 0;

		while (true) {
			const batch = await this.userRepository.findAll({
				where: {
					status: UserStatus.DEACTIVATED,
					deletedAt: LessThan(thresholdDate),
				},
				select: { id: true },
				withDeleted: true,
				take: PURGE_CHUNK_SIZE,
				skip: page * PURGE_CHUNK_SIZE,
			});

			if (batch.length === 0) break;

			for (const { id } of batch) {
				const randomPlain =
					crypto.randomUUID() + crypto.randomBytes(16).toString('hex');
				const hashedRandomPassword = bcrypt.hashSync(randomPlain, 10);

				try {
					await this.userRepository.executeInTransaction(async (manager) => {
						await manager.update(User, { id }, {
							username: () => `CONCAT('purged_', id, '_', username)`,
							email: () =>
								`CASE WHEN email IS NULL THEN NULL ELSE CONCAT('purged_', id, '_', email) END`,
							phone: () =>
								`CASE WHEN phone IS NULL THEN NULL ELSE CONCAT('purged_', id, '_', phone) END`,
							passwordHash: hashedRandomPassword,
							authProvider: 'purged',
							authProviderId: null,
							status: UserStatus.PURGED,
							emailVerified: false,
							phoneVerified: false,
							verificationLevel: VerificationLevel.UNVERIFIED,
							lastLoginAt: null,
						} as any);

						await manager.update(Profile, { userId: id }, {
							displayName: 'Deleted User',
							bio: null,
							avatarMediaId: null,
							coverMediaId: null,
							website: null,
							province: null,
							district: null,
							ward: null,
						} as any);
					});

					successCount++;
				} catch (error) {
					this.logger.error(
						`Failed to purge user ${id}: ${error.message}`,
						error.stack,
					);
				}
			}

			totalProcessed += batch.length;

			// If this batch was smaller than chunk size, no more pages to process.
			if (batch.length < PURGE_CHUNK_SIZE) break;

			page++;
		}

		this.logger.log(
			`Anonymized ${successCount}/${totalProcessed} deactivated user(s) and their profiles.`,
		);
	}
}
