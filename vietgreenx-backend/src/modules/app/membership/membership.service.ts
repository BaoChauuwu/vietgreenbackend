import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { User } from '@app/database/typeorm/entities/identity/user.entity';
import { UserRepository } from '@app/database/typeorm/repositories/user.repository';
import { NotificationRepository } from '@app/database/typeorm/repositories/notification.repository';
import { MembershipTierRepository } from '@app/database/typeorm/repositories/membership-tier.repository';
import { MembershipTier } from '@app/database/typeorm/entities/system/membership-tier.entity';
import { RedisService } from '@app/services/redis/redis.service';
import { MembershipPlan } from '@app/common/enums/membership-plan.enum';
import { NotifType } from '@app/common/enums/notif-type.enum';
import { ErrorCode, HttpNotFoundError } from '@app/common/errors';
import { PLAN_FEATURES } from '@app/common/constants/plan-limits.constant';

const CHUNK_SIZE = 200;

@Injectable()
export class MembershipService {
	private readonly logger = new Logger(MembershipService.name);

	constructor(
		private readonly userRepository: UserRepository,
		private readonly notificationRepository: NotificationRepository,
		private readonly membershipTierRepository: MembershipTierRepository,
		private readonly dataSource: DataSource,
		private readonly redisService: RedisService,
	) {}

	async listActiveTiers(): Promise<MembershipTier[]> {
		return this.membershipTierRepository.findAll({
			where: { isActive: true },
			order: { sortOrder: 'ASC', createdAt: 'ASC' },
		});
	}

	async getMyPlan(user: User) {
		const plan = user.plan ?? MembershipPlan.FREE;
		const expiresAt = user.planExpiresAt ?? null;
		const isExpired = expiresAt != null && new Date(expiresAt) < new Date();
		const effectivePlan = isExpired ? MembershipPlan.FREE : plan;

		const dbTier = await this.membershipTierRepository.findOne({
			plan: effectivePlan,
		});
		const features = dbTier
			? {
					qrLimit: dbTier.qrLimit,
					productLimit: dbTier.productLimit,
					tradePostAllowed: dbTier.tradePostAllowed,
				}
			: PLAN_FEATURES[effectivePlan];

		return {
			plan: effectivePlan,
			originalPlan: plan,
			planExpiresAt: expiresAt,
			isExpired,
			features,
		};
	}

	async assignPlan(
		userId: string,
		plan: MembershipPlan,
		expiresAt: Date | null,
	) {
		const user = await this.userRepository.findById(userId);
		if (!user) {
			throw new HttpNotFoundError(ErrorCode.USER_NOT_FOUND);
		}

		await this.userRepository.update(userId, {
			plan,
			planExpiresAt: expiresAt,
		} as Partial<User>);

		return this.getMyPlan(
			Object.assign(Object.create(Object.getPrototypeOf(user)), user, {
				plan,
				planExpiresAt: expiresAt,
			}) as User,
		);
	}

	async expirePlansAndNotify(): Promise<{
		expired: number;
		notified: number;
	}> {
		const now = new Date();
		const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

		const expiredResult = await this.dataSource.query<{ id: string }[]>(
			`UPDATE identity.users
			 SET plan = 'free', plan_expires_at = NULL
			 WHERE plan != 'free'
			   AND plan_expires_at IS NOT NULL
			   AND plan_expires_at <= $1
			   AND deleted_at IS NULL
			 RETURNING id`,
			[now],
		);

		const expired = expiredResult.length;

		const expiringUsers = await this.dataSource.query<
			Array<{ id: string; plan: string; plan_expires_at: string }>
		>(
			`SELECT id, plan, plan_expires_at
			 FROM identity.users
			 WHERE plan != 'free'
			   AND plan_expires_at IS NOT NULL
			   AND plan_expires_at > $1
			   AND plan_expires_at <= $2
			   AND deleted_at IS NULL`,
			[now, sevenDaysFromNow],
		);

		let notified = 0;

		// 7-day dedup: a user receives at most one SUBSCRIPTION_EXPIRING notification
		// per 7-day window, preventing the daily cron from spamming users.
		const DEDUP_TTL_SECONDS = 7 * 24 * 60 * 60;

		for (let i = 0; i < expiringUsers.length; i += CHUNK_SIZE) {
			const chunk = expiringUsers.slice(i, i + CHUNK_SIZE);

			await Promise.all(
				chunk.map(async (row) => {
					const dedupKey = `membership_expiry_notif:${row.id}`;
					if (await this.redisService.exists(dedupKey)) {
						return;
					}
					const expiresAt = new Date(row.plan_expires_at);
					try {
						await this.notificationRepository.create({
							recipientId: row.id,
							notifType: NotifType.SUBSCRIPTION_EXPIRING,
							title: 'Gói thành viên sắp hết hạn',
							body: `Gói ${row.plan} của bạn sẽ hết hạn vào ngày ${expiresAt.toLocaleDateString('vi-VN')}. Hãy gia hạn để tiếp tục sử dụng.`,
							isRead: false,
							actorId: null,
							entityId: null,
							entityType: null,
							deepLink: null,
						});
						await this.redisService.set(dedupKey, '1', DEDUP_TTL_SECONDS);
						notified++;
					} catch (err) {
						this.logger.warn(
							`Failed to send expiry notification to user ${row.id}: ${err}`,
						);
					}
				}),
			);
		}

		return { expired, notified };
	}
}
