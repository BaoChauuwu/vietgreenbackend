import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BatchRepository } from '@app/database/typeorm/repositories/batch.repository';
import { ProductRepository } from '@app/database/typeorm/repositories/product.repository';
import { CropSeasonRepository } from '@app/database/typeorm/repositories/crop-season.repository';
import { GreenProfileRepository } from '@app/database/typeorm/repositories/green-profile.repository';
import { ProductionLogRepository } from '@app/database/typeorm/repositories/production-log.repository';
import { PublicTraceTokenRepository } from '@app/database/typeorm/repositories/public-trace-token.repository';
import { QrQuotaService } from '../qr-quota/qr-quota.service';
import { CreateBatchRequestDto } from './dto/requests/create-batch.request.dto';
import { UpdateBatchRequestDto } from './dto/requests/update-batch.request.dto';
import { GenerateBatchQrRequestDto } from './dto/requests/generate-batch-qr.request.dto';
import { ListBatchesRequestDto } from './dto/requests/list-batches.request.dto';
import { User } from '@app/database/typeorm/entities/identity/user.entity';
import { HttpBadRequestError } from '@app/common/errors/bad-request.error';
import { HttpNotFoundError } from '@app/common/errors/not-found.error';
import { HttpForbiddenError } from '@app/common/errors/forbidden.error';
import { ErrorCode } from '@app/common/errors/error-code';
import { ProductStatus } from '@app/common/enums/product-status.enum';
import { SeasonStatus } from '@app/common/enums/season-status.enum';
import { BatchStatus } from '@app/common/enums/batch-status.enum';
import { EntityManager, DeepPartial } from 'typeorm';
import { PublicTraceToken } from '@app/database/typeorm/entities/agriculture/public-trace-token.entity';
import { Batch } from '@app/database/typeorm/entities/agriculture/batch.entity';
@Injectable()
export class BatchService {
	constructor(
		private readonly batchRepository: BatchRepository,
		private readonly productRepository: ProductRepository,
		private readonly cropSeasonRepository: CropSeasonRepository,
		private readonly greenProfileRepository: GreenProfileRepository,
		private readonly productionLogRepository: ProductionLogRepository,
		private readonly publicTraceTokenRepository: PublicTraceTokenRepository,
		private readonly qrQuotaService: QrQuotaService,
		private readonly configService: ConfigService,
	) {}

	async create(user: User, dto: CreateBatchRequestDto) {
		const greenProfile = await this.greenProfileRepository.findOne({
			userId: user.id,
		});

		if (!greenProfile) {
			throw new HttpNotFoundError(ErrorCode.GREEN_PROFILE_NOT_FOUND);
		}

		const product = await this.productRepository.findOne({ id: dto.productId });
		if (!product) {
			throw new HttpNotFoundError(ErrorCode.PRODUCT_NOT_FOUND);
		}
		if (
			product.ownerUserId !== user.id ||
			product.greenProfileId !== greenProfile.id
		) {
			throw new HttpForbiddenError(ErrorCode.PRODUCT_FORBIDDEN);
		}
		if (
			product.status === ProductStatus.ARCHIVED ||
			product.status === ProductStatus.DRAFT
		) {
			throw new HttpBadRequestError(
				ErrorCode.CANNOT_CREATE_BATCH_FOR_ARCHIVED_OR_DRAFT_PRODUCT,
			);
		}

		const cropSeason = await this.cropSeasonRepository.findOne({
			id: dto.cropSeasonId,
		});
		if (!cropSeason) {
			throw new HttpNotFoundError(ErrorCode.SEASON_NOT_FOUND);
		}
		if (cropSeason.greenProfileId !== greenProfile.id) {
			throw new HttpForbiddenError(ErrorCode.INVALID_PERMISSION);
		}
		if (cropSeason.status === SeasonStatus.CANCELLED) {
			throw new HttpBadRequestError(ErrorCode.CROP_SEASON_CANCELLED);
		}
		if (cropSeason.productId && cropSeason.productId !== dto.productId) {
			throw new HttpBadRequestError(ErrorCode.CROP_SEASON_PRODUCT_MISMATCH);
		}

		let batchCode = dto.batchCode;
		if (!batchCode) {
			const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
			const randomStr = Math.random()
				.toString(36)
				.substring(2, 6)
				.toUpperCase();
			batchCode = `LOT-${dateStr}-${randomStr}`;
		}

		const existingBatch = await this.batchRepository.findOne({
			productId: dto.productId,
			batchCode,
		});
		if (existingBatch) {
			throw new HttpBadRequestError(ErrorCode.BATCH_CODE_ALREADY_EXISTS);
		}

		const newBatch = await this.batchRepository.create({
			...dto,
			batchCode,
			greenProfileId: greenProfile.id,
			createdBy: user.id,
		});

		return newBatch;
	}

	async findAll(user: User, query: ListBatchesRequestDto) {
		const where: Record<string, unknown> = { createdBy: user.id };
		if (query.productId) where['productId'] = query.productId;

		return this.batchRepository.findWithPagination(query.page, query.limit, {
			where,
			relations: ['cropSeason'],
			order: { createdAt: 'DESC' },
		});
	}

	async findOne(user: User, id: string) {
		const batch = await this.batchRepository.findOne({ id }, ['cropSeason']);
		if (!batch) {
			throw new HttpNotFoundError(ErrorCode.BATCH_NOT_FOUND);
		}

		if (batch.createdBy !== user.id) {
			throw new HttpForbiddenError(ErrorCode.INVALID_PERMISSION);
		}

		let productionLogs: any[] = [];
		if (batch.cropSeasonId) {
			productionLogs = await this.productionLogRepository.findAll({
				where: { cropSeasonId: batch.cropSeasonId },
				order: { logDate: 'DESC' },
			});
		}

		return { ...batch, productionLogs };
	}

	async update(user: User, id: string, dto: UpdateBatchRequestDto) {
		const batch = await this.batchRepository.findOne({ id }, ['cropSeason']);
		if (!batch) {
			throw new HttpNotFoundError(ErrorCode.BATCH_NOT_FOUND);
		}

		if (batch.createdBy !== user.id) {
			throw new HttpForbiddenError(ErrorCode.INVALID_PERMISSION);
		}

		if (
			[BatchStatus.SHIPPED, BatchStatus.SOLD, BatchStatus.RECALLED].includes(
				batch.status,
			) &&
			dto.status !== BatchStatus.RECALLED
		) {
			throw new HttpBadRequestError(
				ErrorCode.BATCH_UPDATE_DENIED_TERMINAL_STATE,
			);
		}

		if (dto.status && dto.status !== batch.status) {
			const validTransitions: Record<BatchStatus, BatchStatus[]> = {
				[BatchStatus.CREATED]: [BatchStatus.QR_GENERATED, BatchStatus.RECALLED],
				[BatchStatus.QR_GENERATED]: [BatchStatus.SHIPPED, BatchStatus.RECALLED],
				[BatchStatus.SHIPPED]: [BatchStatus.SOLD, BatchStatus.RECALLED],
				[BatchStatus.SOLD]: [BatchStatus.RECALLED],
				[BatchStatus.RECALLED]: [],
			};
			if (!validTransitions[batch.status].includes(dto.status)) {
				throw new HttpBadRequestError(ErrorCode.BATCH_INVALID_STATE_TRANSITION);
			}
		}

		if (dto.harvestDate) {
			const harvestDate = new Date(dto.harvestDate);
			if (harvestDate > new Date()) {
				throw new HttpBadRequestError(ErrorCode.BATCH_INVALID_HARVEST_DATE);
			}
			if (batch.cropSeasonId && batch.cropSeason) {
				const startDate = new Date(batch.cropSeason.startDate);
				if (harvestDate < startDate) {
					throw new HttpBadRequestError(ErrorCode.BATCH_INVALID_HARVEST_DATE);
				}
			}
		}

		if (dto.batchCode && dto.batchCode !== batch.batchCode) {
			if (batch.status !== BatchStatus.CREATED) {
				throw new HttpBadRequestError(
					ErrorCode.BATCH_CODE_UPDATE_DENIED_AFTER_QR,
				);
			}
			const existingBatch = await this.batchRepository.findOne({
				productId: batch.productId,
				batchCode: dto.batchCode,
			});
			if (existingBatch) {
				throw new HttpBadRequestError(ErrorCode.BATCH_CODE_ALREADY_EXISTS);
			}
		}

		return this.batchRepository.update({ id }, dto);
	}

	async generateQrCodes(
		user: User,
		id: string,
		dto: GenerateBatchQrRequestDto,
	) {
		const batch = await this.batchRepository.findOne({ id });
		if (!batch) {
			throw new HttpNotFoundError(ErrorCode.BATCH_NOT_FOUND);
		}

		if (batch.createdBy !== user.id) {
			throw new HttpForbiddenError(ErrorCode.INVALID_PERMISSION);
		}

		if (
			![BatchStatus.CREATED, BatchStatus.QR_GENERATED].includes(batch.status)
		) {
			throw new HttpBadRequestError(ErrorCode.BATCH_INVALID_STATE_TRANSITION);
		}

		const createdTokens = await this.batchRepository.executeInTransaction(
			async (manager: EntityManager) => {
				await this.qrQuotaService.checkAndDeductQuota(
					user,
					dto.amount,
					manager,
				);

				const tokensData: DeepPartial<PublicTraceToken>[] = [];
				for (let i = 0; i < dto.amount; i++) {
					tokensData.push({
						batchId: batch.id,
						targetType: 'batch',
						createdBy: user.id,
					});
				}

				const entities = manager.create(PublicTraceToken, tokensData);
				const savedTokens = await manager.save(PublicTraceToken, entities);

				if (batch.status === BatchStatus.CREATED) {
					await manager.update(
						Batch,
						{ id: batch.id },
						{ status: BatchStatus.QR_GENERATED },
					);
				}

				return savedTokens;
			},
		);

		const traceBaseUrl = this.configService.get<string>(
			'TRACE_BASE_URL',
			'http://localhost:3000',
		);

		return {
			tokens: createdTokens.map((t) => ({
				token: t.token,
				traceUrl: `${traceBaseUrl}/trace/${t.token}`,
			})),
		};
	}
}
