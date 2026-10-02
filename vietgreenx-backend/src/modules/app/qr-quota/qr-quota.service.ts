import { Injectable } from '@nestjs/common';
import { QrQuotaTrackingRepository } from '@app/database/typeorm/repositories/qr-quota-tracking.repository';
import { User } from '@app/database/typeorm/entities/identity/user.entity';
import { ErrorCode } from '@app/common/errors/error-code';
import { ConfigService } from '@nestjs/config';
import { ConfigKeys } from '@app/config/config-key.enum';
import { EntityManager } from 'typeorm';
import { QrQuotaTracking } from '@app/database/typeorm/entities/agriculture/qr-quota-tracking.entity';
import {
	HttpBadRequestError,
	HttpInternalServerError,
} from '@app/common/errors';

@Injectable()
export class QrQuotaService {
	constructor(
		private readonly qrQuotaTrackingRepository: QrQuotaTrackingRepository,
		private readonly configService: ConfigService,
	) {}

	private getCurrentBillingPeriod(user: User): string {
		const now = new Date();
		const createdAt = user.createdAt ? new Date(user.createdAt) : now;

		const msIn30Days = 30 * 24 * 60 * 60 * 1000;
		const diffMs = Math.max(0, now.getTime() - createdAt.getTime());

		const cycleIndex = Math.floor(diffMs / msIn30Days);
		return `cycle-${cycleIndex}`;
	}

	async getQuotaSummary(user: User) {
		const billingPeriod = this.getCurrentBillingPeriod(user);
		let quota = await this.qrQuotaTrackingRepository.findOne({
			userId: user.id,
			billingPeriod,
		});

		if (!quota) {
			try {
				quota = await this.qrQuotaTrackingRepository.create({
					userId: user.id,
					billingPeriod,
					qrLimit: this.configService.get<number>(
						ConfigKeys.DEFAULT_QR_LIMIT,
						1000,
					),
					qrGenerated: 0,
					extraQuota: 0,
				});
			} catch (error: any) {
				if (error?.code === '23505' || error?.code === 'ER_DUP_ENTRY') {
					quota = await this.qrQuotaTrackingRepository.findOne({
						userId: user.id,
						billingPeriod,
					});
					if (!quota) throw error;
				} else {
					throw new HttpInternalServerError({
						errorCode: ErrorCode.INTERNAL_SERVER_ERROR,
						message: error.message || 'Failed to create quota',
					});
				}
			}
		}

		const totalAllowed = quota.qrLimit + quota.extraQuota;
		const remaining = totalAllowed - quota.qrGenerated;

		return {
			billingPeriod,
			qrLimit: quota.qrLimit,
			extraQuota: quota.extraQuota,
			qrGenerated: quota.qrGenerated,
			totalAllowed,
			remaining: remaining > 0 ? remaining : 0,
		};
	}

	async checkAndDeductQuota(
		user: User,
		amount: number,
		manager?: EntityManager,
	) {
		const billingPeriod = this.getCurrentBillingPeriod(user);

		let quota = manager
			? await manager.findOne(QrQuotaTracking, {
					where: { userId: user.id, billingPeriod },
					lock: { mode: 'pessimistic_write' },
				})
			: await this.qrQuotaTrackingRepository.findOne({
					userId: user.id,
					billingPeriod,
				});

		if (!quota) {
			const initialData = {
				userId: user.id,
				billingPeriod,
				qrLimit: this.configService.get<number>(
					ConfigKeys.DEFAULT_QR_LIMIT,
					1000,
				),
				qrGenerated: 0,
				extraQuota: 0,
			};

			try {
				if (manager) {
					quota = manager.create(QrQuotaTracking, initialData);
					await manager.save(QrQuotaTracking, quota);
				} else {
					quota = await this.qrQuotaTrackingRepository.create(initialData);
				}
			} catch (error: any) {
				if (error?.code === '23505' || error?.code === 'ER_DUP_ENTRY') {
					quota = manager
						? await manager.findOne(QrQuotaTracking, {
								where: { userId: user.id, billingPeriod },
								lock: { mode: 'pessimistic_write' },
							})
						: await this.qrQuotaTrackingRepository.findOne({
								userId: user.id,
								billingPeriod,
							});

					if (!quota) throw error;
				} else {
					throw new HttpInternalServerError({
						errorCode: ErrorCode.INTERNAL_SERVER_ERROR,
						message: error.message || 'Failed to create quota',
					});
				}
			}
		}

		const totalAllowed = quota.qrLimit + quota.extraQuota;

		if (quota.qrGenerated + amount > totalAllowed) {
			throw new HttpBadRequestError(ErrorCode.QR_QUOTA_EXCEEDED);
		}

		const doUpdate = async (em: EntityManager) => {
			await em
				.createQueryBuilder()
				.update(QrQuotaTracking)
				.set({ qrGenerated: () => `qr_generated + ${amount}` })
				.where('id = :id', { id: quota!.id })
				.execute();
		};

		if (manager) {
			await doUpdate(manager);
		} else {
			await this.qrQuotaTrackingRepository.executeInTransaction(
				async (txManager) => {
					const locked = await txManager.findOne(QrQuotaTracking, {
						where: { id: quota!.id },
						lock: { mode: 'pessimistic_write' },
					});
					if (!locked)
						throw new HttpInternalServerError({
							errorCode: ErrorCode.INTERNAL_SERVER_ERROR,
							message: 'Quota record lost',
						});
					if (
						locked.qrGenerated + amount >
						locked.qrLimit + locked.extraQuota
					) {
						throw new HttpBadRequestError(ErrorCode.QR_QUOTA_EXCEEDED);
					}
					await doUpdate(txManager);
				},
			);
		}

		return true;
	}
}
