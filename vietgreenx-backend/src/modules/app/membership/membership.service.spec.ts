import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { MembershipService } from './membership.service';
import { UserRepository } from '@app/database/typeorm/repositories/user.repository';
import { NotificationRepository } from '@app/database/typeorm/repositories/notification.repository';
import { MembershipPlan } from '@app/common/enums/membership-plan.enum';
import { NotifType } from '@app/common/enums/notif-type.enum';
import { HttpNotFoundError } from '@app/common/errors';

// ─── Mock factories ───────────────────────────────────────────────────────────

const createMockUserRepository = () => ({
	findById: jest.fn(),
	update: jest.fn(),
});

const createMockNotificationRepository = () => ({
	create: jest.fn().mockResolvedValue({}),
});

const createMockDataSource = () => ({
	query: jest.fn(),
});

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const FUTURE_DATE = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
const PAST_DATE = new Date(Date.now() - 24 * 60 * 60 * 1000); // yesterday

const buildUser = (overrides = {}) =>
	({ id: 'user-uuid-1', plan: null, planExpiresAt: null, ...overrides }) as any;

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('MembershipService', () => {
	let service: MembershipService;
	let userRepository: ReturnType<typeof createMockUserRepository>;
	let notificationRepository: ReturnType<
		typeof createMockNotificationRepository
	>;
	let dataSource: ReturnType<typeof createMockDataSource>;

	beforeEach(async () => {
		userRepository = createMockUserRepository();
		notificationRepository = createMockNotificationRepository();
		dataSource = createMockDataSource();

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				MembershipService,
				{ provide: UserRepository, useValue: userRepository },
				{ provide: NotificationRepository, useValue: notificationRepository },
				{ provide: DataSource, useValue: dataSource },
			],
		}).compile();

		service = module.get<MembershipService>(MembershipService);
	});

	afterEach(() => jest.clearAllMocks());

	// ─── getMyPlan ────────────────────────────────────────────────────────────

	describe('getMyPlan', () => {
		it('returns FREE plan with isExpired=false and FREE features when plan is null and no expiry', async () => {
			const user = buildUser({ plan: null, planExpiresAt: null });

			const result = await service.getMyPlan(user);

			expect(result.plan).toBe(MembershipPlan.FREE);
			expect(result.originalPlan).toBe(MembershipPlan.FREE);
			expect(result.isExpired).toBe(false);
			expect(result.planExpiresAt).toBeNull();
			expect(result.features).toEqual({
				qrLimit: 0,
				productLimit: 5,
				tradePostAllowed: false,
			});
		});

		it('returns SELLER plan with isExpired=false and SELLER features when plan is SELLER and expiry is in the future', async () => {
			const user = buildUser({
				plan: MembershipPlan.SELLER,
				planExpiresAt: FUTURE_DATE,
			});

			const result = await service.getMyPlan(user);

			expect(result.plan).toBe(MembershipPlan.SELLER);
			expect(result.originalPlan).toBe(MembershipPlan.SELLER);
			expect(result.isExpired).toBe(false);
			expect(result.features).toEqual({
				qrLimit: 500,
				productLimit: 50,
				tradePostAllowed: true,
			});
		});

		it('returns effectivePlan=FREE with isExpired=true and FREE features when plan is SELLER and expiry is in the past', async () => {
			const user = buildUser({
				plan: MembershipPlan.SELLER,
				planExpiresAt: PAST_DATE,
			});

			const result = await service.getMyPlan(user);

			expect(result.plan).toBe(MembershipPlan.FREE);
			expect(result.originalPlan).toBe(MembershipPlan.SELLER);
			expect(result.isExpired).toBe(true);
			expect(result.features).toEqual({
				qrLimit: 0,
				productLimit: 5,
				tradePostAllowed: false,
			});
		});

		it('returns COOPERATIVE_ENTERPRISE plan with isExpired=false when plan is COOPERATIVE_ENTERPRISE and no expiry', async () => {
			const user = buildUser({
				plan: MembershipPlan.COOPERATIVE_ENTERPRISE,
				planExpiresAt: null,
			});

			const result = await service.getMyPlan(user);

			expect(result.plan).toBe(MembershipPlan.COOPERATIVE_ENTERPRISE);
			expect(result.isExpired).toBe(false);
			expect(result.features).toEqual({
				qrLimit: 5000,
				productLimit: 500,
				tradePostAllowed: true,
			});
		});
	});

	// ─── assignPlan ───────────────────────────────────────────────────────────

	describe('assignPlan', () => {
		it('throws HttpNotFoundError when user is not found', async () => {
			userRepository.findById.mockResolvedValue(null);

			await expect(
				service.assignPlan(
					'non-existent-user',
					MembershipPlan.SELLER,
					FUTURE_DATE,
				),
			).rejects.toThrow(HttpNotFoundError);
		});

		it('calls userRepository.update with the given plan and expiresAt', async () => {
			const user = buildUser({
				plan: MembershipPlan.FREE,
				planExpiresAt: null,
			});
			userRepository.findById.mockResolvedValue(user);
			userRepository.update.mockResolvedValue(undefined);

			await service.assignPlan(
				'user-uuid-1',
				MembershipPlan.SELLER,
				FUTURE_DATE,
			);

			expect(userRepository.update).toHaveBeenCalledWith('user-uuid-1', {
				plan: MembershipPlan.SELLER,
				planExpiresAt: FUTURE_DATE,
			});
		});

		it('returns the plan status reflecting the newly assigned plan', async () => {
			const user = buildUser({
				plan: MembershipPlan.FREE,
				planExpiresAt: null,
			});
			userRepository.findById.mockResolvedValue(user);
			userRepository.update.mockResolvedValue(undefined);

			const result = await service.assignPlan(
				'user-uuid-1',
				MembershipPlan.SELLER,
				FUTURE_DATE,
			);

			expect(result.plan).toBe(MembershipPlan.SELLER);
			expect(result.isExpired).toBe(false);
		});
	});

	// ─── expirePlansAndNotify ─────────────────────────────────────────────────

	describe('expirePlansAndNotify', () => {
		it('returns { expired: 2, notified: 1 } when two plans expired and one user is expiring soon', async () => {
			dataSource.query
				.mockResolvedValueOnce([{ id: '1' }, { id: '2' }])
				.mockResolvedValueOnce([
					{ id: '3', plan: 'seller', plan_expires_at: '2026-07-05T00:00:00Z' },
				]);

			const result = await service.expirePlansAndNotify();

			expect(result).toEqual({ expired: 2, notified: 1 });
			expect(dataSource.query).toHaveBeenCalledTimes(2);
			expect(notificationRepository.create).toHaveBeenCalledTimes(1);
			expect(notificationRepository.create).toHaveBeenCalledWith(
				expect.objectContaining({
					recipientId: '3',
					notifType: NotifType.SUBSCRIPTION_EXPIRING,
				}),
			);
		});

		it('returns { expired: 0, notified: 0 } when there are no expired or expiring users', async () => {
			dataSource.query.mockResolvedValueOnce([]).mockResolvedValueOnce([]);

			const result = await service.expirePlansAndNotify();

			expect(result).toEqual({ expired: 0, notified: 0 });
			expect(notificationRepository.create).not.toHaveBeenCalled();
		});

		it('continues and only counts successfully notified users when notification create fails for one user', async () => {
			dataSource.query.mockResolvedValueOnce([]).mockResolvedValueOnce([
				{
					id: 'user-ok',
					plan: 'seller',
					plan_expires_at: '2026-07-05T00:00:00Z',
				},
				{
					id: 'user-fail',
					plan: 'seller',
					plan_expires_at: '2026-07-06T00:00:00Z',
				},
			]);

			notificationRepository.create
				.mockResolvedValueOnce({})
				.mockRejectedValueOnce(new Error('DB error'));

			const result = await service.expirePlansAndNotify();

			expect(result.expired).toBe(0);
			expect(result.notified).toBe(1);
			expect(notificationRepository.create).toHaveBeenCalledTimes(2);
		});
	});
});
