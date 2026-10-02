import { Pagination } from '@app/common/types/request-response.type';
import { ListCropSeasonsRequestDto } from './dto/requests/list-crop-seasons.request.dto';
import { CropSeasonRepository } from '@app/database/typeorm/repositories/crop-season.repository';
import { Injectable } from '@nestjs/common';
import { User } from '@app/database/typeorm/entities/identity/user.entity';
import { CreateCropSeasonRequestDto } from './dto/requests/create-crop-season.request.dto';
import { UpdateCropSeasonRequestDto } from './dto/requests/update-crop-season.request.dto';
import { SeasonStatus } from '@app/common/enums/season-status.enum';
import { CropSeason } from '@app/database/typeorm/entities/agriculture/crop-season.entity';
import { GreenProfileRepository } from '@app/database/typeorm/repositories/green-profile.repository';
import { OrganizationMemberRepository } from '@app/database/typeorm/repositories/organization-member.repository';
import { ProductRepository } from '@app/database/typeorm/repositories/product.repository';
import { HttpBadRequestError } from '@app/common/errors/bad-request.error';
import { HttpNotFoundError } from '@app/common/errors/not-found.error';
import { ErrorCode } from '@app/common/errors/error-code';
import { ProductionLogRepository } from '@app/database/typeorm/repositories/production-log.repository';
import { BatchRepository } from '@app/database/typeorm/repositories/batch.repository';
import { GreenProfileAccessService } from '../green-profile/green-profile-access.service';

@Injectable()
export class CropSeasonService {
	constructor(
		private readonly cropSeasonRepository: CropSeasonRepository,
		private readonly greenProfileRepository: GreenProfileRepository,
		private readonly organizationMemberRepository: OrganizationMemberRepository,
		private readonly productRepository: ProductRepository,
		private readonly productLogRepository: ProductionLogRepository,
		private readonly batchRepository: BatchRepository,
		private readonly greenProfileAccessService: GreenProfileAccessService,
	) {}

	async create(
		user: User,
		dto: CreateCropSeasonRequestDto,
	): Promise<CropSeason> {
		const start = new Date(dto.startDate.split('T')[0]);
		const expectedHarvest = new Date(dto.expectedHarvestDate.split('T')[0]);
		if (start >= expectedHarvest) {
			throw new HttpBadRequestError(ErrorCode.CROP_SEASON_INVALID_DATES);
		}

		const greenProfile = await this.greenProfileRepository.findOne({
			userId: user.id,
		});
		if (!greenProfile) {
			throw new HttpNotFoundError(ErrorCode.GREEN_PROFILE_NOT_FOUND);
		}

		if (
			greenProfile.farmAreaHa !== null &&
			dto.areaHa > greenProfile.farmAreaHa
		) {
			throw new HttpBadRequestError(
				ErrorCode.CROP_SEASON_AREA_EXCEEDS_FARM_AREA,
			);
		}

		if (dto.productId) {
			const productExists = await this.productRepository.findOne({
				id: dto.productId,
				greenProfileId: greenProfile.id,
			});
			if (!productExists) {
				throw new HttpNotFoundError(ErrorCode.PRODUCT_NOT_FOUND);
			}
		}

		return await this.cropSeasonRepository.create({
			...dto,
			greenProfileId: greenProfile.id,
			organizationId: greenProfile.organizationId,
			createdBy: user.id,
		});
	}

	async listCropSeasons(
		user: User,
		query: ListCropSeasonsRequestDto,
	): Promise<Pagination<CropSeason>> {
		const greenProfile = await this.greenProfileRepository.findOne({
			userId: user.id,
		});
		if (!greenProfile) {
			return {
				page: query.page ?? 1,
				limit: query.limit ?? 20,
				total: 0,
				totalPage: 0,
				items: [],
			};
		}

		const whereCondition: any = { greenProfileId: greenProfile.id };
		if (query.status) {
			whereCondition.status = query.status;
		}

		return await this.cropSeasonRepository.findWithPagination(
			query.page,
			query.limit,
			{
				where: whereCondition,
				order: { createdAt: 'DESC' },
			},
		);
	}

	async getCropSeasonDetails(user: User, id: string): Promise<CropSeason> {
		return await this.greenProfileAccessService.assertSeasonBelongsToUser(
			user.id,
			id,
		);
	}

	async update(
		user: User,
		id: string,
		dto: UpdateCropSeasonRequestDto,
	): Promise<CropSeason> {
		const cropSeason = await this.getCropSeasonDetails(user, id);

		if (
			cropSeason.status === SeasonStatus.HARVESTED ||
			cropSeason.status === SeasonStatus.CANCELLED
		) {
			throw new HttpBadRequestError(
				ErrorCode.CROP_SEASON_CANNOT_UPDATE_TERMINAL_STATE,
			);
		}

		if (dto.startDate || dto.expectedHarvestDate) {
			const startStr = dto.startDate || cropSeason.startDate;
			const expectedStr =
				dto.expectedHarvestDate || cropSeason.expectedHarvestDate;
			const start = new Date(startStr.split('T')[0]);
			const expectedHarvest = new Date(expectedStr.split('T')[0]);
			if (start >= expectedHarvest) {
				throw new HttpBadRequestError(ErrorCode.CROP_SEASON_INVALID_DATES);
			}
		}

		if (dto.actualHarvestDate) {
			const startStr = dto.startDate || cropSeason.startDate;
			const start = new Date(startStr.split('T')[0]);
			const actualHarvest = new Date(dto.actualHarvestDate.split('T')[0]);
			if (actualHarvest < start) {
				throw new HttpBadRequestError(
					ErrorCode.CROP_SEASON_INVALID_ACTUAL_HARVEST_DATE,
				);
			}
		}

		if (dto.areaHa !== undefined) {
			const greenProfile = cropSeason.greenProfile;
			if (
				greenProfile.farmAreaHa !== null &&
				dto.areaHa > greenProfile.farmAreaHa
			) {
				throw new HttpBadRequestError(
					ErrorCode.CROP_SEASON_AREA_EXCEEDS_FARM_AREA,
				);
			}
		}

		if (dto.productId) {
			const productExists = await this.productRepository.findOne({
				id: dto.productId,
				greenProfileId: cropSeason.greenProfileId,
			});
			if (!productExists) {
				throw new HttpNotFoundError(ErrorCode.PRODUCT_NOT_FOUND);
			}
		}

		const updated = await this.cropSeasonRepository.update(id, dto);
		if (!updated) {
			throw new HttpNotFoundError(ErrorCode.SEASON_NOT_FOUND);
		}
		return updated;
	}

	async updateStatus(
		user: User,
		id: string,
		newStatus: SeasonStatus,
	): Promise<CropSeason> {
		const cropSeason = await this.getCropSeasonDetails(user, id);
		const currentStatus = cropSeason.status;

		if (currentStatus === newStatus) {
			return cropSeason;
		}

		let isValidTransition = false;
		switch (currentStatus) {
			case SeasonStatus.PLANNING:
				isValidTransition =
					newStatus === SeasonStatus.ACTIVE ||
					newStatus === SeasonStatus.CANCELLED;
				break;
			case SeasonStatus.ACTIVE:
				isValidTransition =
					newStatus === SeasonStatus.HARVESTED ||
					newStatus === SeasonStatus.CANCELLED;
				break;
			case SeasonStatus.HARVESTED:
			case SeasonStatus.CANCELLED:
				isValidTransition = false;
				break;
			default:
				isValidTransition = false;
		}

		if (!isValidTransition) {
			throw new HttpBadRequestError(
				ErrorCode.CROP_SEASON_INVALID_STATE_TRANSITION,
			);
		}

		const updated = await this.cropSeasonRepository.update(id, {
			status: newStatus,
		});
		if (!updated) {
			throw new HttpNotFoundError(ErrorCode.SEASON_NOT_FOUND);
		}
		return updated;
	}

	async deleteCropSeason(user: User, id: string): Promise<CropSeason> {
		const cropSeason = await this.getCropSeasonDetails(user, id);

		const productLogResult = await this.productLogRepository.findOneByOptions({
			where: { cropSeasonId: id },
			select: ['id'],
		});
		if (productLogResult) {
			throw new HttpBadRequestError(
				ErrorCode.CROP_SEASON_DELETE_DENIED_HAS_DATA,
			);
		}
		const batchResult = await this.batchRepository.findOneByOptions({
			where: { cropSeasonId: id },
			select: ['id'],
			withDeleted: true,
		});
		if (batchResult) {
			throw new HttpBadRequestError(
				ErrorCode.CROP_SEASON_DELETE_DENIED_HAS_DATA,
			);
		}
		const deleted = await this.cropSeasonRepository.softDelete(id);
		if (!deleted) {
			throw new HttpNotFoundError(ErrorCode.SEASON_NOT_FOUND);
		}
		return cropSeason;
	}
}
