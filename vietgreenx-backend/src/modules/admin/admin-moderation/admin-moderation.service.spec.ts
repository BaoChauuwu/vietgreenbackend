import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { AdminModerationService } from './admin-moderation.service';
import { ReportRepository } from '@app/database/typeorm/repositories/report.repository';
import { ReportStatus } from '@app/common/enums/report-status.enum';
import { HttpNotFoundError, HttpBadRequestError } from '@app/common/errors';
import { ModerationAction } from './dto/requests/process-report.request.dto';

const createMockQb = () => ({
	select: jest.fn().mockReturnThis(),
	from: jest.fn().mockReturnThis(),
	where: jest.fn().mockReturnThis(),
	andWhere: jest.fn().mockReturnThis(),
	orderBy: jest.fn().mockReturnThis(),
	addOrderBy: jest.fn().mockReturnThis(),
	offset: jest.fn().mockReturnThis(),
	limit: jest.fn().mockReturnThis(),
	getCount: jest.fn().mockResolvedValue(0),
	getRawMany: jest.fn().mockResolvedValue([]),
	getRawOne: jest.fn().mockResolvedValue(null),
});

const createMockDataSource = () => ({
	createQueryBuilder: jest.fn(),
	query: jest.fn().mockResolvedValue(undefined),
});

describe('AdminModerationService', () => {
	let service: AdminModerationService;
	let reportRepository: ReturnType<typeof createMockReportRepository>;
	let dataSource: ReturnType<typeof createMockDataSource>;

	const createMockReportRepository = () => ({
		findOne: jest.fn(),
		update: jest.fn().mockResolvedValue(undefined),
	});

	beforeEach(async () => {
		reportRepository = createMockReportRepository();
		dataSource = createMockDataSource();

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				AdminModerationService,
				{ provide: ReportRepository, useValue: reportRepository },
				{ provide: DataSource, useValue: dataSource },
			],
		}).compile();

		service = module.get<AdminModerationService>(AdminModerationService);
	});

	afterEach(() => jest.clearAllMocks());

	describe('findAll', () => {
		it('returns correct Pagination shape', async () => {
			const qb = createMockQb();
			qb.getCount.mockResolvedValue(10);
			qb.getRawMany.mockResolvedValue([{ id: '1' }, { id: '2' }]);
			dataSource.createQueryBuilder.mockReturnValue(qb);

			const result = await service.findAll({
				page: 2,
				limit: 5,
				status: undefined,
				targetType: undefined,
				reason: undefined,
			} as any);

			expect(result).toEqual({
				items: [{ id: '1' }, { id: '2' }],
				total: 10,
				page: 2,
				limit: 5,
				totalPage: 2,
			});
		});

		it('calls andWhere for status, targetType, reason when provided', async () => {
			const qb = createMockQb();
			dataSource.createQueryBuilder.mockReturnValue(qb);

			await service.findAll({
				page: 1,
				limit: 10,
				status: ReportStatus.PENDING,
				targetType: 'post',
				reason: 'spam',
			} as any);

			expect(qb.andWhere).toHaveBeenCalledTimes(3);
			expect(qb.andWhere).toHaveBeenCalledWith('r.status = :status', {
				status: ReportStatus.PENDING,
			});
			expect(qb.andWhere).toHaveBeenCalledWith('r.target_type = :targetType', {
				targetType: 'post',
			});
			expect(qb.andWhere).toHaveBeenCalledWith('r.reason = :reason', {
				reason: 'spam',
			});
		});

		it('does not call andWhere when status, targetType, reason are absent', async () => {
			const qb = createMockQb();
			dataSource.createQueryBuilder.mockReturnValue(qb);

			await service.findAll({
				page: 1,
				limit: 10,
				status: undefined,
				targetType: undefined,
				reason: undefined,
			} as any);

			expect(qb.andWhere).not.toHaveBeenCalled();
		});

		it('calculates offset correctly from page and limit', async () => {
			const qb = createMockQb();
			dataSource.createQueryBuilder.mockReturnValue(qb);

			await service.findAll({ page: 3, limit: 20 } as any);

			expect(qb.offset).toHaveBeenCalledWith(40);
			expect(qb.limit).toHaveBeenCalledWith(20);
		});

		it('computes totalPage via Math.ceil', async () => {
			const qb = createMockQb();
			qb.getCount.mockResolvedValue(11);
			dataSource.createQueryBuilder.mockReturnValue(qb);

			const result = await service.findAll({ page: 1, limit: 5 } as any);

			expect(result.totalPage).toBe(3);
		});
	});

	describe('findOne', () => {
		it('throws HttpNotFoundError when row is not found', async () => {
			const qb = createMockQb();
			qb.getRawOne.mockResolvedValue(null);
			dataSource.createQueryBuilder.mockReturnValue(qb);

			await expect(service.findOne('missing-id')).rejects.toThrow(
				HttpNotFoundError,
			);
		});

		it('returns the row when found', async () => {
			const row = { id: 'abc', status: ReportStatus.PENDING };
			const qb = createMockQb();
			qb.getRawOne.mockResolvedValue(row);
			dataSource.createQueryBuilder.mockReturnValue(qb);

			const result = await service.findOne('abc');

			expect(result).toEqual(row);
		});
	});

	describe('processAction', () => {
		const adminId = 'admin-1';
		const reportId = 'report-1';

		it('throws HttpNotFoundError when report is not found', async () => {
			reportRepository.findOne.mockResolvedValue(null);

			await expect(
				service.processAction(
					reportId,
					{ action: ModerationAction.DISMISS },
					adminId,
				),
			).rejects.toThrow(HttpNotFoundError);
		});

		it('DISMISS action sets status to DISMISSED and does not call dataSource.query', async () => {
			const report = { id: reportId, targetType: 'post', targetId: 'post-1' };
			reportRepository.findOne.mockResolvedValue(report);

			const findOneQb = createMockQb();
			findOneQb.getRawOne.mockResolvedValue({
				id: reportId,
				status: ReportStatus.DISMISSED,
			});
			dataSource.createQueryBuilder.mockReturnValue(findOneQb);

			await service.processAction(
				reportId,
				{ action: ModerationAction.DISMISS },
				adminId,
			);

			expect(reportRepository.update).toHaveBeenCalledWith(
				reportId,
				expect.objectContaining({ status: ReportStatus.DISMISSED }),
			);
			expect(dataSource.query).not.toHaveBeenCalled();
		});

		it('REMOVE action on post calls dataSource.query with correct UPDATE SQL', async () => {
			const report = { id: reportId, targetType: 'post', targetId: 'post-99' };
			reportRepository.findOne.mockResolvedValue(report);

			const findOneQb = createMockQb();
			findOneQb.getRawOne.mockResolvedValue({ id: reportId });
			dataSource.createQueryBuilder.mockReturnValue(findOneQb);

			await service.processAction(
				reportId,
				{ action: ModerationAction.REMOVE },
				adminId,
			);

			expect(dataSource.query).toHaveBeenCalledWith(
				'UPDATE content.posts SET deleted_at = NOW() WHERE id = $1',
				['post-99'],
			);
		});

		it('REMOVE action on user (not in TARGET_TABLE_MAP) throws HttpBadRequestError', async () => {
			const report = { id: reportId, targetType: 'user', targetId: 'user-1' };
			reportRepository.findOne.mockResolvedValue(report);

			await expect(
				service.processAction(
					reportId,
					{ action: ModerationAction.REMOVE },
					adminId,
				),
			).rejects.toThrow(HttpBadRequestError);
		});

		it('BAN action on user calls dataSource.query to ban in identity.users', async () => {
			const report = { id: reportId, targetType: 'user', targetId: 'user-77' };
			reportRepository.findOne.mockResolvedValue(report);

			const findOneQb = createMockQb();
			findOneQb.getRawOne.mockResolvedValue({ id: reportId });
			dataSource.createQueryBuilder.mockReturnValue(findOneQb);

			await service.processAction(
				reportId,
				{ action: ModerationAction.BAN },
				adminId,
			);

			expect(dataSource.query).toHaveBeenCalledWith(
				`UPDATE identity.users SET status = 'banned' WHERE id = $1`,
				['user-77'],
			);
		});

		it('BAN action on non-user targetType throws HttpBadRequestError', async () => {
			const report = { id: reportId, targetType: 'post', targetId: 'post-1' };
			reportRepository.findOne.mockResolvedValue(report);

			await expect(
				service.processAction(
					reportId,
					{ action: ModerationAction.BAN },
					adminId,
				),
			).rejects.toThrow(HttpBadRequestError);
		});

		it('calls findOne(id) after a successful action to return updated row', async () => {
			const updatedRow = { id: reportId, status: ReportStatus.ACTIONED };
			const report = { id: reportId, targetType: 'post', targetId: 'post-1' };
			reportRepository.findOne.mockResolvedValue(report);

			const findOneQb = createMockQb();
			findOneQb.getRawOne.mockResolvedValue(updatedRow);
			dataSource.createQueryBuilder.mockReturnValue(findOneQb);

			const result = await service.processAction(
				reportId,
				{ action: ModerationAction.REMOVE },
				adminId,
			);

			expect(result).toEqual(updatedRow);
		});

		it('WARN action sets status to ACTIONED and does not call dataSource.query', async () => {
			const report = { id: reportId, targetType: 'post', targetId: 'post-1' };
			reportRepository.findOne.mockResolvedValue(report);

			const findOneQb = createMockQb();
			findOneQb.getRawOne.mockResolvedValue({
				id: reportId,
				status: ReportStatus.ACTIONED,
			});
			dataSource.createQueryBuilder.mockReturnValue(findOneQb);

			await service.processAction(
				reportId,
				{ action: ModerationAction.WARN },
				adminId,
			);

			expect(reportRepository.update).toHaveBeenCalledWith(
				reportId,
				expect.objectContaining({ status: ReportStatus.ACTIONED }),
			);
			expect(dataSource.query).not.toHaveBeenCalled();
		});
	});
});
