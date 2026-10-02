import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ReportRepository } from '@app/database/typeorm/repositories/report.repository';
import { ReportStatus } from '@app/common/enums/report-status.enum';
import {
	ErrorCode,
	HttpNotFoundError,
	HttpBadRequestError,
} from '@app/common/errors';
import { ModerationQueryRequestDto } from './dto/requests/moderation-query.request.dto';
import {
	ModerationAction,
	ProcessReportRequestDto,
} from './dto/requests/process-report.request.dto';
import { Pagination } from '@app/common/types/request-response.type';
import { AppAuthService } from '@app/modules/app/app-auth/app-auth.service';
import { NotificationService } from '@app/modules/app/notification/notification.service';

const TARGET_TABLE_MAP: Record<string, { schema: string; table: string }> = {
	post: { schema: 'content', table: 'posts' },
	comment: { schema: 'engagement', table: 'comments' },
	product: { schema: 'agriculture', table: 'products' },
};

@Injectable()
export class AdminModerationService {
	constructor(
		private readonly reportRepository: ReportRepository,
		private readonly dataSource: DataSource,
		private readonly appAuthService: AppAuthService,
		private readonly notificationService: NotificationService,
	) {}

	async findAll(query: ModerationQueryRequestDto): Promise<Pagination<any>> {
		const { page, limit, status, targetType, reason, sortBy, sortOrder } =
			query;
		const offset = (page - 1) * limit;

		const qb = this.dataSource
			.createQueryBuilder()
			.select([
				'r.id AS id',
				'r.reporter_id AS "reporterId"',
				'r.target_type AS "targetType"',
				'r.target_id AS "targetId"',
				'r.reason AS reason',
				'r.details AS details',
				'r.status AS status',
				'r.action_taken AS "actionTaken"',
				'r.action_note AS "actionNote"',
				'r.actioned_at AS "actionedAt"',
				'r.is_priority AS "isPriority"',
				'r.created_at AS "createdAt"',
				'(SELECT COUNT(*)::int FROM moderation.reports r2 WHERE r2.target_id = r.target_id) AS "reportCount"',
			])
			.from('moderation.reports', 'r');

		if (status) {
			qb.andWhere('r.status = :status', { status });
		}
		if (targetType) {
			qb.andWhere('r.target_type = :targetType', { targetType });
		}
		if (reason) {
			qb.andWhere('r.reason = :reason', { reason });
		}

		if (
			sortBy &&
			['targetType', 'reason', 'status', 'createdAt'].includes(sortBy)
		) {
			const sortCol =
				sortBy === 'createdAt'
					? 'r.created_at'
					: `r.${sortBy === 'targetType' ? 'target_type' : sortBy}`;
			qb.orderBy(sortCol, sortOrder === 'ASC' ? 'ASC' : 'DESC');
		} else if (sortBy === 'reportCount') {
			qb.orderBy(
				'(SELECT COUNT(*) FROM moderation.reports r2 WHERE r2.target_id = r.target_id)',
				sortOrder === 'ASC' ? 'ASC' : 'DESC',
			);
		} else {
			qb.orderBy(
				'(SELECT COUNT(*) FROM moderation.reports r2 WHERE r2.target_id = r.target_id)',
				'DESC',
			).addOrderBy('r.created_at', 'DESC');
		}

		const total = await qb.getCount();

		const items = await qb.offset(offset).limit(limit).getRawMany();

		return {
			items,
			total,
			page,
			limit,
			totalPage: Math.ceil(total / limit),
		};
	}

	async findOne(id: string): Promise<any> {
		const row = await this.dataSource
			.createQueryBuilder()
			.select([
				'r.id AS id',
				'r.reporter_id AS "reporterId"',
				'r.target_type AS "targetType"',
				'r.target_id AS "targetId"',
				'r.reason AS reason',
				'r.details AS details',
				'r.status AS status',
				'r.action_taken AS "actionTaken"',
				'r.action_note AS "actionNote"',
				'r.actioned_at AS "actionedAt"',
				'r.is_priority AS "isPriority"',
				'r.created_at AS "createdAt"',
				'(SELECT COUNT(*)::int FROM moderation.reports r2 WHERE r2.target_id = r.target_id) AS "reportCount"',
			])
			.from('moderation.reports', 'r')
			.where('r.id = :id', { id })
			.getRawOne();

		if (!row) {
			throw new HttpNotFoundError(ErrorCode.REPORT_NOT_FOUND);
		}

		return row;
	}

	async processAction(
		id: string,
		dto: ProcessReportRequestDto,
		adminId: string,
	): Promise<any> {
		const report = await this.reportRepository.findOne({ id });
		if (!report) {
			throw new HttpNotFoundError(ErrorCode.REPORT_NOT_FOUND);
		}

		const newStatus =
			dto.action === ModerationAction.DISMISS
				? ReportStatus.DISMISSED
				: ReportStatus.ACTIONED;

		await this.reportRepository.update(id, {
			status: newStatus,
			actionedBy: adminId,
			actionTaken: dto.action,
			actionNote: dto.note ?? null,
			actionedAt: new Date(),
		} as any);

		if (dto.action === ModerationAction.REMOVE) {
			const target = TARGET_TABLE_MAP[report.targetType];
			if (!target) {
				throw new HttpBadRequestError(
					ErrorCode.REPORT_INVALID_ACTION_FOR_TARGET,
				);
			}
			await this.dataSource.query(
				`UPDATE ${target.schema}.${target.table} SET deleted_at = NOW() WHERE id = $1`,
				[report.targetId],
			);
		} else if (dto.action === ModerationAction.BAN) {
			if (report.targetType !== 'user') {
				throw new HttpBadRequestError(
					ErrorCode.REPORT_INVALID_ACTION_FOR_TARGET,
				);
			}
			await this.dataSource.query(
				`UPDATE identity.users SET status = 'banned' WHERE id = $1`,
				[report.targetId],
			);
			await this.appAuthService.revokeAllSessions(report.targetId);
		}

		const notifAction =
			dto.action === ModerationAction.DISMISS ? 'dismissed' : 'actioned';
		await this.notificationService.sendReportActionedNotification(
			report.reporterId,
			notifAction,
		);

		return this.findOne(id);
	}
}
