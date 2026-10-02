import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { QrQuotaService } from './qr-quota.service';
import { QrQuotaTrackingRepository } from '@app/database/typeorm/repositories/qr-quota-tracking.repository';
import { createUser } from '@app/__tests__/factories/user.factory';
import { HttpBadRequestError } from '@app/common/errors';
import { QrQuotaTracking } from '@app/database/typeorm/entities/agriculture/qr-quota-tracking.entity';

const buildQuota = (
	overrides: Partial<QrQuotaTracking> = {},
): QrQuotaTracking =>
	({
		id: 'quota-id-1',
		userId: 'user-id-1',
		billingPeriod: 'cycle-0',
		qrLimit: 1000,
		qrGenerated: 0,
		extraQuota: 0,
		...overrides,
	}) as QrQuotaTracking;

const createMockQrQuotaTrackingRepository = () => ({
	findOne: jest.fn(),
	create: jest.fn(),
	executeInTransaction: jest.fn(),
});

const createMockConfigService = () => ({
	get: jest.fn().mockReturnValue(1000),
});

describe('QrQuotaService', () => {
	let service: QrQuotaService;
	let repo: ReturnType<typeof createMockQrQuotaTrackingRepository>;

	beforeEach(async () => {
		repo = createMockQrQuotaTrackingRepository();

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				QrQuotaService,
				{ provide: QrQuotaTrackingRepository, useValue: repo },
				{ provide: ConfigService, useValue: createMockConfigService() },
			],
		}).compile();

		service = module.get<QrQuotaService>(QrQuotaService);
	});

	afterEach(() => jest.clearAllMocks());

	// ─── getQuotaSummary ──────────────────────────────────────────────────────

	describe('getQuotaSummary', () => {
		it('returns existing quota summary correctly', async () => {
			const user = createUser({ id: 'user-id-1' });
			const quota = buildQuota({ qrGenerated: 300 });
			repo.findOne.mockResolvedValue(quota);

			const result = await service.getQuotaSummary(user);

			expect(result.qrLimit).toBe(1000);
			expect(result.qrGenerated).toBe(300);
			expect(result.totalAllowed).toBe(1000);
			expect(result.remaining).toBe(700);
		});

		it('creates quota record when none exists', async () => {
			const user = createUser({ id: 'user-id-1' });
			const newQuota = buildQuota();
			repo.findOne.mockResolvedValue(null);
			repo.create.mockResolvedValue(newQuota);

			const result = await service.getQuotaSummary(user);

			expect(repo.create).toHaveBeenCalledWith(
				expect.objectContaining({
					userId: user.id,
					qrGenerated: 0,
					extraQuota: 0,
				}),
			);
			expect(result.remaining).toBe(1000);
		});

		it('clamps remaining to 0 when over quota', async () => {
			const user = createUser({ id: 'user-id-1' });
			const quota = buildQuota({
				qrLimit: 100,
				qrGenerated: 120,
				extraQuota: 0,
			});
			repo.findOne.mockResolvedValue(quota);

			const result = await service.getQuotaSummary(user);

			expect(result.remaining).toBe(0);
		});

		it('includes extraQuota in totalAllowed', async () => {
			const user = createUser({ id: 'user-id-1' });
			const quota = buildQuota({
				qrLimit: 1000,
				extraQuota: 500,
				qrGenerated: 0,
			});
			repo.findOne.mockResolvedValue(quota);

			const result = await service.getQuotaSummary(user);

			expect(result.totalAllowed).toBe(1500);
			expect(result.remaining).toBe(1500);
		});

		it('retries findOne on duplicate key error during create', async () => {
			const user = createUser({ id: 'user-id-1' });
			const existingQuota = buildQuota();
			repo.findOne
				.mockResolvedValueOnce(null)
				.mockResolvedValueOnce(existingQuota);
			repo.create.mockRejectedValue({ code: '23505' });

			const result = await service.getQuotaSummary(user);

			expect(result.qrLimit).toBe(1000);
		});
	});

	// ─── checkAndDeductQuota ──────────────────────────────────────────────────

	describe('checkAndDeductQuota', () => {
		it('deducts quota via transaction when no external manager provided', async () => {
			const user = createUser({ id: 'user-id-1' });
			const quota = buildQuota({ qrGenerated: 0, qrLimit: 1000 });
			repo.findOne.mockResolvedValue(quota);

			repo.executeInTransaction.mockImplementation(async (cb) => {
				const mockManager = {
					findOne: jest.fn().mockResolvedValue(quota),
					createQueryBuilder: jest.fn().mockReturnValue({
						update: jest.fn().mockReturnThis(),
						set: jest.fn().mockReturnThis(),
						where: jest.fn().mockReturnThis(),
						execute: jest.fn().mockResolvedValue({}),
					}),
				};
				return cb(mockManager);
			});

			await expect(service.checkAndDeductQuota(user, 10)).resolves.toBe(true);
		});

		it('throws QR_QUOTA_EXCEEDED when amount exceeds remaining', async () => {
			const user = createUser({ id: 'user-id-1' });
			const quota = buildQuota({
				qrGenerated: 990,
				qrLimit: 1000,
				extraQuota: 0,
			});
			repo.findOne.mockResolvedValue(quota);

			repo.executeInTransaction.mockImplementation(async (cb) => {
				const mockManager = {
					findOne: jest.fn().mockResolvedValue(quota),
					createQueryBuilder: jest.fn().mockReturnValue({
						update: jest.fn().mockReturnThis(),
						set: jest.fn().mockReturnThis(),
						where: jest.fn().mockReturnThis(),
						execute: jest.fn().mockResolvedValue({}),
					}),
				};
				return cb(mockManager);
			});

			await expect(service.checkAndDeductQuota(user, 20)).rejects.toThrow(
				HttpBadRequestError,
			);
		});

		it('uses provided manager directly without opening a new transaction', async () => {
			const user = createUser({ id: 'user-id-1' });
			const quota = buildQuota({ qrGenerated: 0 });

			const mockManager = {
				findOne: jest.fn().mockResolvedValue(quota),
				create: jest.fn().mockReturnValue(quota),
				save: jest.fn().mockResolvedValue(quota),
				createQueryBuilder: jest.fn().mockReturnValue({
					update: jest.fn().mockReturnThis(),
					set: jest.fn().mockReturnThis(),
					where: jest.fn().mockReturnThis(),
					execute: jest.fn().mockResolvedValue({}),
				}),
			};

			await expect(
				service.checkAndDeductQuota(user, 5, mockManager as any),
			).resolves.toBe(true);
			expect(repo.executeInTransaction).not.toHaveBeenCalled();
		});

		it('creates quota record when not found, then deducts', async () => {
			const user = createUser({ id: 'user-id-1' });
			const quota = buildQuota();
			repo.findOne.mockResolvedValue(null);

			repo.executeInTransaction.mockImplementation(async (cb) => {
				const mockManager = {
					findOne: jest.fn().mockResolvedValue(quota),
					create: jest.fn().mockReturnValue(quota),
					save: jest.fn().mockResolvedValue(quota),
					createQueryBuilder: jest.fn().mockReturnValue({
						update: jest.fn().mockReturnThis(),
						set: jest.fn().mockReturnThis(),
						where: jest.fn().mockReturnThis(),
						execute: jest.fn().mockResolvedValue({}),
					}),
				};
				return cb(mockManager);
			});

			repo.create.mockResolvedValue(quota);

			await expect(service.checkAndDeductQuota(user, 1)).resolves.toBe(true);
		});
	});
});
