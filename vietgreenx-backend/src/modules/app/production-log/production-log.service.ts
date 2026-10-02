import { Pagination } from '@app/common/types/request-response.type';
import { Injectable } from '@nestjs/common';
import { ProductionLogRepository } from '@app/database/typeorm/repositories/production-log.repository';
import { ProductionLogNoteRepository } from '@app/database/typeorm/repositories/note.repository';
import { CropSeasonService } from '../crop-season/crop-season.service';
import { MediaRepository } from '@app/database/typeorm/repositories/media.repository';
import { MediaUploadService } from '../media/media-upload.service';
import { User } from '@app/database/typeorm/entities/identity/user.entity';
import { CreateProductionLogRequestDto } from './dto/requests/create-production-log.request.dto';
import { CreateProductionLogNoteRequestDto } from './dto/requests/create-production-log-note.request.dto';
import { ProductionLog } from '@app/database/typeorm/entities/agriculture/production-log.entity';
import { ProductionLogNote } from '@app/database/typeorm/entities/agriculture/production-log-note.entity';

type ProductionLogWithExtras = ProductionLog & {
	additionalNotes?: ProductionLogNote[];
	medias?: { id: string; cdnUrl: string; mimeType: string }[];
};
import { HttpBadRequestError } from '@app/common/errors/bad-request.error';
import { HttpNotFoundError } from '@app/common/errors/not-found.error';
import { ErrorCode } from '@app/common/errors/error-code';
import { SeasonStatus } from '@app/common/enums/season-status.enum';
import { PaginationDto } from '@app/common/dtos/paginationDto';
import { ActivityType } from '@app/common/enums/activity-type.enum';
import { In } from 'typeorm';

export interface QrMilestoneSummary {
	milestone: ActivityType | string;
	logs: ProductionLog[];
}

@Injectable()
export class ProductionLogService {
	constructor(
		private readonly productionLogRepo: ProductionLogRepository,
		private readonly noteRepo: ProductionLogNoteRepository,
		private readonly cropSeasonService: CropSeasonService,
		private readonly mediaRepo: MediaRepository,
		private readonly mediaUploadService: MediaUploadService,
	) {}

	async createProductionLog(
		user: User,
		seasonId: string,
		dto: CreateProductionLogRequestDto,
	): Promise<ProductionLog> {
		const cropSeason = await this.cropSeasonService.getCropSeasonDetails(
			user,
			seasonId,
		);

		if (
			cropSeason.status === SeasonStatus.HARVESTED ||
			cropSeason.status === SeasonStatus.CANCELLED
		) {
			throw new HttpBadRequestError(
				ErrorCode.PRODUCTION_LOG_CANNOT_ADD_TO_TERMINAL_STATE,
			);
		}

		const logDate = new Date(dto.logDate.split('T')[0]);
		const todayStr = new Date().toISOString().split('T')[0];
		const today = new Date(todayStr);

		if (logDate > today) {
			throw new HttpBadRequestError(
				ErrorCode.PRODUCTION_LOG_INVALID_DATE_FUTURE,
			);
		}

		const startDate = new Date(cropSeason.startDate.split('T')[0]);
		if (logDate < startDate) {
			throw new HttpBadRequestError(
				ErrorCode.PRODUCTION_LOG_INVALID_DATE_BEFORE_START,
			);
		}

		if (dto.mediaIds && dto.mediaIds.length > 0) {
			const uniqueIds = [...new Set(dto.mediaIds)];
			if (uniqueIds.length !== dto.mediaIds.length) {
				throw new HttpBadRequestError(ErrorCode.PRODUCTION_LOG_MEDIA_NOT_FOUND);
			}

			const mediaList = await this.mediaRepo.findByIds(uniqueIds);
			if (mediaList.length !== uniqueIds.length) {
				throw new HttpBadRequestError(ErrorCode.PRODUCTION_LOG_MEDIA_NOT_FOUND);
			}

			for (const media of mediaList) {
				this.mediaUploadService.assertMediaReadyForProductionLog(
					media,
					user.id,
				);
			}

			dto.mediaIds = uniqueIds;
		}

		return this.productionLogRepo.executeInTransaction(async (manager) => {
			const { notes, ...logDto } = dto;
			const logEntity = manager.create(ProductionLog, {
				...logDto,
				cropSeasonId: seasonId,
				createdBy: user.id,
				mediaIds: logDto.mediaIds || [],
			});
			const productionLog = await manager.save(logEntity);

			if (notes) {
				const noteEntity = manager.create(ProductionLogNote, {
					logId: productionLog.id,
					createdBy: user.id,
					noteBody: notes,
				});
				await manager.save(noteEntity);
				productionLog.notes = notes;
			}

			return productionLog;
		});
	}

	async getProductionLogs(
		user: User,
		seasonId: string,
		query: PaginationDto,
	): Promise<Pagination<ProductionLog>> {
		await this.cropSeasonService.getCropSeasonDetails(user, seasonId);

		const { page, limit } = query;

		return this.productionLogRepo.findWithPagination(page, limit, {
			where: { cropSeasonId: seasonId },
			order: {
				logDate: 'DESC',
				createdAt: 'DESC',
			},
		});
	}

	async getProductionLogDetails(
		user: User,
		id: string,
	): Promise<ProductionLogWithExtras> {
		const log = await this.productionLogRepo.findOne({ id }, [
			'cropSeason',
			'cropSeason.greenProfile',
		]);

		if (!log) {
			throw new HttpNotFoundError(ErrorCode.PRODUCTION_LOG_NOT_FOUND);
		}

		if (log.cropSeason.greenProfile.userId !== user.id) {
			throw new HttpNotFoundError(ErrorCode.PRODUCTION_LOG_NOT_FOUND);
		}

		const [additionalNotes, mediaList] = await Promise.all([
			this.noteRepo.findAll({
				where: { logId: id },
				order: { createdAt: 'ASC' },
			}),
			log.mediaIds?.length
				? this.mediaRepo.findByIdsPreserveOrder(log.mediaIds)
				: Promise.resolve([]),
		]);

		const result = log as ProductionLogWithExtras;
		result.additionalNotes = additionalNotes;
		result.medias = mediaList.map((m) => ({
			id: m.id,
			cdnUrl: m.cdnUrl,
			mimeType: m.mimeType,
		}));
		return result;
	}

	async addNoteToLog(
		user: User,
		id: string,
		dto: CreateProductionLogNoteRequestDto,
	): Promise<ProductionLogNote> {
		const log = await this.productionLogRepo.findOne({ id }, [
			'cropSeason',
			'cropSeason.greenProfile',
		]);

		if (!log) {
			throw new HttpNotFoundError(ErrorCode.PRODUCTION_LOG_NOT_FOUND);
		}

		if (log.cropSeason.greenProfile.userId !== user.id) {
			throw new HttpNotFoundError(ErrorCode.PRODUCTION_LOG_NOT_FOUND);
		}

		if (
			log.cropSeason.status === SeasonStatus.HARVESTED ||
			log.cropSeason.status === SeasonStatus.CANCELLED
		) {
			throw new HttpBadRequestError(
				ErrorCode.PRODUCTION_LOG_CANNOT_ADD_TO_TERMINAL_STATE,
			);
		}

		return this.noteRepo.create({
			logId: id,
			createdBy: user.id,
			noteBody: dto.noteBody,
		});
	}

	async getQrSummary(seasonId: string): Promise<QrMilestoneSummary[]> {
		const logs = await this.productionLogRepo.findAll({
			where: { cropSeasonId: seasonId },
			order: { logDate: 'ASC', createdAt: 'ASC' },
		});

		if (logs.length > 0) {
			const logIds = logs.map((l) => l.id);
			const allNotes = await this.noteRepo.findAll({
				where: { logId: In(logIds) },
				order: { createdAt: 'DESC' },
			});

			const notesMap = new Map<string, string>();
			for (const note of allNotes) {
				if (!notesMap.has(note.logId)) {
					notesMap.set(note.logId, note.noteBody);
				}
			}

			for (const log of logs) {
				log.notes = notesMap.get(log.id) || null;
			}
		}

		const milestones = [
			{ milestone: ActivityType.SOWING, logs: [] as ProductionLog[] },
			{ milestone: ActivityType.CARING, logs: [] as ProductionLog[] },
			{ milestone: ActivityType.FERTILIZING, logs: [] as ProductionLog[] },
			{ milestone: ActivityType.SPRAYING, logs: [] as ProductionLog[] },
			{ milestone: ActivityType.HARVESTING, logs: [] as ProductionLog[] },
		];

		for (const log of logs) {
			if (log.activityType === ActivityType.SOWING) {
				milestones[0].logs.push(log);
			} else if (log.activityType === ActivityType.FERTILIZING) {
				milestones[2].logs.push(log);
			} else if (log.activityType === ActivityType.SPRAYING) {
				milestones[3].logs.push(log);
			} else if (log.activityType === ActivityType.HARVESTING) {
				milestones[4].logs.push(log);
			} else {
				milestones[1].logs.push(log);
			}
		}

		return milestones;
	}
}
