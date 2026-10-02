import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { AdminDashboardService } from './admin-dashboard.service';
import { AppVersionRepository } from '@app/database/typeorm/repositories/app-version.repository';
import { AppVersion } from '@app/database/typeorm/entities/system/app-version.entity';
import { HttpNotFoundError } from '@app/common/errors';

const createMockInsertQb = () => ({
	insert: jest.fn().mockReturnThis(),
	into: jest.fn().mockReturnThis(),
	values: jest.fn().mockReturnThis(),
	orUpdate: jest.fn().mockReturnThis(),
	execute: jest.fn().mockResolvedValue({}),
});

const createMockSelectQb = () => ({
	select: jest.fn().mockReturnThis(),
	from: jest.fn().mockReturnThis(),
	innerJoin: jest.fn().mockReturnThis(),
	groupBy: jest.fn().mockReturnThis(),
	orderBy: jest.fn().mockReturnThis(),
	limit: jest.fn().mockReturnThis(),
	getRawMany: jest.fn().mockResolvedValue([]),
});

const createMockAppVersionRepository = () => ({
	findAll: jest.fn(),
	findOne: jest.fn(),
	findById: jest.fn(),
	update: jest.fn(),
});

const createMockDataSource = () => ({
	createQueryBuilder: jest.fn(),
	query: jest.fn(),
});

describe('AdminDashboardService', () => {
	let service: AdminDashboardService;
	let appVersionRepository: ReturnType<typeof createMockAppVersionRepository>;
	let dataSource: ReturnType<typeof createMockDataSource>;

	beforeEach(async () => {
		appVersionRepository = createMockAppVersionRepository();
		dataSource = createMockDataSource();

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				AdminDashboardService,
				{ provide: AppVersionRepository, useValue: appVersionRepository },
				{ provide: DataSource, useValue: dataSource },
			],
		}).compile();

		service = module.get<AdminDashboardService>(AdminDashboardService);
	});

	afterEach(() => jest.clearAllMocks());

	describe('getStats', () => {
		it('calls dataSource.query once and returns result[0]', async () => {
			const statsRow = {
				totalUsers: 100,
				newUsersToday: 5,
				totalPosts: 42,
				totalProducts: 10,
				totalQrGenerated: 200,
				totalQrScans: 1500,
			};
			dataSource.query.mockResolvedValue([statsRow]);

			const result = await service.getStats();

			expect(dataSource.query).toHaveBeenCalledTimes(1);
			expect(result).toEqual(statsRow);
		});

		it('passes result[0] through without modification', async () => {
			const statsRow = { totalUsers: 0, newUsersToday: 0 };
			dataSource.query.mockResolvedValue([statsRow, { ignored: true }]);

			const result = await service.getStats();

			expect(result).toBe(statsRow);
		});
	});

	describe('getTopProducts', () => {
		it('calls createQueryBuilder and returns getRawMany result', async () => {
			const topProducts = [
				{ productId: 'p1', name: 'Product A', totalScans: 999 },
				{ productId: 'p2', name: 'Product B', totalScans: 500 },
			];
			const qb = createMockSelectQb();
			qb.getRawMany.mockResolvedValue(topProducts);
			dataSource.createQueryBuilder.mockReturnValue(qb);

			const result = await service.getTopProducts();

			expect(dataSource.createQueryBuilder).toHaveBeenCalledTimes(1);
			expect(qb.getRawMany).toHaveBeenCalledTimes(1);
			expect(result).toEqual(topProducts);
		});

		it('returns an empty array when getRawMany resolves with []', async () => {
			const qb = createMockSelectQb();
			dataSource.createQueryBuilder.mockReturnValue(qb);

			const result = await service.getTopProducts();

			expect(result).toEqual([]);
		});
	});

	describe('listAppVersions', () => {
		it('calls appVersionRepository.findAll with correct order options', async () => {
			const versions = [{ id: 'v1' } as AppVersion];
			appVersionRepository.findAll.mockResolvedValue(versions);

			const result = await service.listAppVersions();

			expect(appVersionRepository.findAll).toHaveBeenCalledWith({
				order: { platform: 'ASC', releasedAt: 'DESC' },
			});
			expect(result).toEqual(versions);
		});
	});

	describe('createAppVersion', () => {
		const dto = {
			platform: 'ios',
			latestVersion: '2.0.0',
			minVersion: '1.5.0',
			recommendedVersion: '1.9.0',
			forceUpdate: false,
			softUpdate: true,
			storeUrlIos: 'https://apple.com/app',
			storeUrlAndroid: null,
			releaseNotesVi: null,
			releaseNotesEn: null,
		} as any;
		const createdBy = 'admin-1';

		it('calls dataSource QB with insert, orUpdate, and execute', async () => {
			const qb = createMockInsertQb();
			dataSource.createQueryBuilder.mockReturnValue(qb);
			const record = {
				id: 'av1',
				platform: 'ios',
				latestVersion: '2.0.0',
			} as AppVersion;
			appVersionRepository.findOne.mockResolvedValue(record);

			await service.createAppVersion(dto, createdBy);

			expect(qb.insert).toHaveBeenCalled();
			expect(qb.into).toHaveBeenCalledWith(AppVersion);
			expect(qb.values).toHaveBeenCalled();
			expect(qb.orUpdate).toHaveBeenCalled();
			expect(qb.execute).toHaveBeenCalled();
		});

		it('calls appVersionRepository.findOne with { platform, latestVersion }', async () => {
			const qb = createMockInsertQb();
			dataSource.createQueryBuilder.mockReturnValue(qb);
			const record = {
				id: 'av1',
				platform: 'ios',
				latestVersion: '2.0.0',
			} as AppVersion;
			appVersionRepository.findOne.mockResolvedValue(record);

			await service.createAppVersion(dto, createdBy);

			expect(appVersionRepository.findOne).toHaveBeenCalledWith({
				platform: dto.platform,
				latestVersion: dto.latestVersion,
			});
		});

		it('throws HttpNotFoundError when findOne returns null after insert', async () => {
			const qb = createMockInsertQb();
			dataSource.createQueryBuilder.mockReturnValue(qb);
			appVersionRepository.findOne.mockResolvedValue(null);

			await expect(service.createAppVersion(dto, createdBy)).rejects.toThrow(
				HttpNotFoundError,
			);
		});

		it('returns the record when findOne succeeds', async () => {
			const qb = createMockInsertQb();
			dataSource.createQueryBuilder.mockReturnValue(qb);
			const record = {
				id: 'av1',
				platform: 'ios',
				latestVersion: '2.0.0',
			} as AppVersion;
			appVersionRepository.findOne.mockResolvedValue(record);

			const result = await service.createAppVersion(dto, createdBy);

			expect(result).toEqual(record);
		});
	});

	describe('updateAppVersion', () => {
		const id = 'av-99';
		const dto = { minVersion: '1.6.0' } as any;

		it('throws HttpNotFoundError when findById returns null', async () => {
			appVersionRepository.findById.mockResolvedValue(null);

			await expect(service.updateAppVersion(id, dto)).rejects.toThrow(
				HttpNotFoundError,
			);
		});

		it('throws HttpNotFoundError when update returns null (update failed)', async () => {
			appVersionRepository.findById.mockResolvedValue({ id } as AppVersion);
			appVersionRepository.update.mockResolvedValue(null);

			await expect(service.updateAppVersion(id, dto)).rejects.toThrow(
				HttpNotFoundError,
			);
		});

		it('calls findById then update and returns the updated record on success', async () => {
			const existing = {
				id,
				platform: 'android',
				latestVersion: '1.0.0',
			} as AppVersion;
			const updated = {
				id,
				platform: 'android',
				latestVersion: '1.0.0',
				minVersion: '1.6.0',
			} as AppVersion;
			appVersionRepository.findById.mockResolvedValue(existing);
			appVersionRepository.update.mockResolvedValue(updated);

			const result = await service.updateAppVersion(id, dto);

			expect(appVersionRepository.findById).toHaveBeenCalledWith(id);
			expect(appVersionRepository.update).toHaveBeenCalledWith(id, dto);
			expect(result).toEqual(updated);
		});
	});
});
