import { Injectable } from '@nestjs/common';
import { EntityManager, In } from 'typeorm';
import { GreenProfileRepository } from '@app/database/typeorm/repositories/green-profile.repository';
import {
	ProductReviewRepository,
	RatingBreakdown,
} from '@app/database/typeorm/repositories/product-review.repository';
import { CreateGreenProfileRequestDto } from './dto/requests/create-green-profile.request.dto';
import { GreenProfile } from '@app/database/typeorm/entities';
import { MediaRepository } from '@app/database/typeorm/repositories/media.repository';

export async function enrichGreenProfileWithMedia(
	profile: GreenProfile,
	mediaRepository: MediaRepository,
): Promise<GreenProfile> {
	const photoIds = profile.photoMediaIds ?? [];
	const videoIds = profile.videoMediaIds ?? [];
	const avatarId = profile.avatarMediaId ?? null;

	const [photos, videos, avatarMedia] = await Promise.all([
		photoIds.length > 0
			? mediaRepository.findByIdsPreserveOrder(photoIds)
			: Promise.resolve([]),
		videoIds.length > 0
			? mediaRepository.findByIdsPreserveOrder(videoIds)
			: Promise.resolve([]),
		avatarId ? mediaRepository.findById(avatarId) : Promise.resolve(null),
	]);

	profile.avatarUrl = avatarMedia?.cdnUrl ?? null;

	profile.photoMedias = photos.map((m) => ({
		id: m.id,
		cdnUrl: m.cdnUrl,
		thumbnailUrl: m.thumbnailUrl,
		mimeType: m.mimeType,
		widthPx: m.widthPx,
		heightPx: m.heightPx,
	}));

	profile.videoMedias = videos.map((m) => ({
		id: m.id,
		cdnUrl: m.cdnUrl,
		mimeType: m.mimeType,
	}));

	return profile;
}

type GreenProfileWithCoords = GreenProfile & {
	latitude: number | null;
	longitude: number | null;
};
import {
	ErrorCode,
	HttpBadRequestError,
	HttpForbiddenError,
	HttpNotFoundError,
} from '@app/common/errors';
import { OrganizationMemberRepository } from '@app/database/typeorm/repositories/organization-member.repository';
import { v4 as uuidv4 } from 'uuid';
import { OrgRole } from '@app/common/enums/org-role.enum';
import { OrgMemberStatus } from '@app/common/enums/org-member-status.enum';
import { UpdateGreenProfileRequestDto } from './dto/requests/update-green-profile.request.dto';
import { MediaUploadService } from '../media/media-upload.service';
import { CertificationStatus } from '@app/common/enums/certification-status.enum';
import { ProductStatus } from '@app/common/enums/product-status.enum';
import { CategoryRepository } from '@app/database/typeorm/repositories/category.repository';

@Injectable()
export class GreenProfileService {
	constructor(
		private readonly greenProfileRepository: GreenProfileRepository,
		private readonly organizationMemberRepository: OrganizationMemberRepository,
		private readonly mediaRepository: MediaRepository,
		private readonly mediaUploadService: MediaUploadService,
		private readonly categoryRepository: CategoryRepository,
		private readonly productReviewRepository: ProductReviewRepository,
	) {}

	async createGreenProfile(
		userId: string,
		dto: CreateGreenProfileRequestDto,
	): Promise<GreenProfile> {
		const checkCondition = dto.organizationId
			? { organizationId: dto.organizationId }
			: { userId };

		const existingProfile =
			await this.greenProfileRepository.findOne(checkCondition);

		if (existingProfile) {
			throw new HttpBadRequestError(
				dto.organizationId
					? ErrorCode.ORGANIZATION_ALREADY_HAS_GREEN_PROFILE
					: ErrorCode.USER_ALREADY_HAS_GREEN_PROFILE,
			);
		}

		let finalUserId: string | null = userId;
		let finalOrganizationId: string | null = null;

		if (dto.organizationId) {
			await this.assertUserIsOrgAdmin(userId, dto.organizationId);
			finalUserId = null;
			finalOrganizationId = dto.organizationId;
		}

		const { latitude, longitude, ...profileData } = dto;

		const slug = this.generateSlug(dto.profileName);

		await this.validateMediaIds(
			userId,
			dto.avatarMediaId,
			dto.photoMediaIds,
			dto.videoMediaIds,
			finalOrganizationId ?? undefined,
		);
		await this.validateCategoryIds(dto.mainCategoryIds);

		return this.greenProfileRepository.executeInTransaction(
			async (manager: EntityManager) => {
				const profileEntity = manager.create(GreenProfile, {
					...profileData,
					userId: finalUserId,
					organizationId: finalOrganizationId,
					slug,
				});

				const newProfile = await manager.save(profileEntity);

				if (latitude !== undefined && longitude !== undefined) {
					await this.greenProfileRepository.updateLocation(
						newProfile.id,
						latitude,
						longitude,
						manager,
					);
				}

				const result = Object.assign(newProfile, {
					latitude: latitude ?? null,
					longitude: longitude ?? null,
				}) as GreenProfileWithCoords;
				return this.enrichWithMedia(result);
			},
		);
	}

	async updateGreenProfile(
		userId: string,
		dto: UpdateGreenProfileRequestDto,
		organizationId?: string,
	): Promise<GreenProfile> {
		if (organizationId) {
			await this.assertUserIsOrgAdmin(userId, organizationId);
		}

		const checkCondition = organizationId ? { organizationId } : { userId };

		const greenProfile =
			await this.greenProfileRepository.findOneWithCoords(checkCondition);

		if (!greenProfile) {
			throw new HttpNotFoundError(ErrorCode.GREEN_PROFILE_NOT_FOUND);
		}

		const { latitude, longitude, ...profileData } = dto;

		if (dto.profileName && dto.profileName !== greenProfile.profileName) {
			greenProfile.slug = this.generateSlug(dto.profileName);
		}

		Object.assign(greenProfile, profileData);

		await this.validateMediaIds(
			userId,
			dto.avatarMediaId,
			dto.photoMediaIds,
			dto.videoMediaIds,
			organizationId,
		);
		await this.validateCategoryIds(dto.mainCategoryIds);

		return this.greenProfileRepository.executeInTransaction(
			async (manager: EntityManager) => {
				const updatedProfile = await manager.save(GreenProfile, greenProfile);

				if (latitude !== undefined && longitude !== undefined) {
					await this.greenProfileRepository.updateLocation(
						updatedProfile.id,
						latitude,
						longitude,
						manager,
					);
				}

				const finalProfile =
					await this.greenProfileRepository.findOneWithCoords(
						{ id: updatedProfile.id },
						[],
						manager,
					);

				if (!finalProfile) {
					throw new HttpNotFoundError(ErrorCode.GREEN_PROFILE_NOT_FOUND);
				}

				const result = Object.assign(finalProfile, {
					latitude:
						latitude !== undefined ? latitude : greenProfile['latitude'],
					longitude:
						longitude !== undefined ? longitude : greenProfile['longitude'],
				});
				return this.enrichWithMedia(result);
			},
		);
	}

	private async assertUserIsOrgAdmin(
		userId: string,
		organizationId: string,
	): Promise<void> {
		const member = await this.organizationMemberRepository.findOne({
			userId,
			organizationId,
			status: OrgMemberStatus.ACTIVE,
		});

		if (!member) {
			throw new HttpForbiddenError(ErrorCode.ORGANIZATION_NOT_MEMBER);
		}

		if (member.orgRole !== OrgRole.ADMIN) {
			throw new HttpForbiddenError(
				ErrorCode.ONLY_ACTIVE_ADMINS_CAN_PERFORM_THIS_ACTION,
			);
		}
	}

	private async validateMediaIds(
		userId: string,
		avatarMediaId?: string | null,
		photoMediaIds?: string[],
		videoMediaIds?: string[],
		organizationId?: string,
	): Promise<void> {
		const allowedUploaderIds = organizationId
			? await this.getOrgMemberIds(organizationId)
			: undefined;

		if (avatarMediaId) {
			const avatarMedia = await this.mediaRepository.findById(avatarMediaId);
			if (!avatarMedia) {
				throw new HttpBadRequestError(ErrorCode.MEDIA_NOT_FOUND);
			}
			this.mediaUploadService.assertMediaReadyForAvatar(avatarMedia, userId);
		}

		if (photoMediaIds && photoMediaIds.length > 0) {
			const uniqueIds = [...new Set(photoMediaIds)];
			if (uniqueIds.length !== photoMediaIds.length) {
				throw new HttpBadRequestError(ErrorCode.MEDIA_NOT_FOUND);
			}

			const mediaList = await this.mediaRepository.findByIds(uniqueIds);
			if (mediaList.length !== uniqueIds.length) {
				throw new HttpBadRequestError(ErrorCode.MEDIA_NOT_FOUND);
			}

			for (const media of mediaList) {
				this.mediaUploadService.assertMediaReadyForGreenProfilePhoto(
					media,
					userId,
					allowedUploaderIds,
				);
			}
		}

		if (videoMediaIds && videoMediaIds.length > 0) {
			const uniqueIds = [...new Set(videoMediaIds)];
			if (uniqueIds.length !== videoMediaIds.length) {
				throw new HttpBadRequestError(ErrorCode.MEDIA_NOT_FOUND);
			}

			const videoList = await this.mediaRepository.findByIds(uniqueIds);
			if (videoList.length !== uniqueIds.length) {
				throw new HttpBadRequestError(ErrorCode.MEDIA_NOT_FOUND);
			}

			for (const media of videoList) {
				this.mediaUploadService.assertMediaReadyForGreenProfileVideo(
					media,
					userId,
					allowedUploaderIds,
				);
			}
		}
	}

	private async getOrgMemberIds(organizationId: string): Promise<string[]> {
		const members = await this.organizationMemberRepository.findAll({
			where: { organizationId, status: OrgMemberStatus.ACTIVE },
		});
		return members.map((m) => m.userId);
	}

	private async validateCategoryIds(categoryIds?: string[]): Promise<void> {
		if (categoryIds && categoryIds.length > 0) {
			const uniqueIds = [...new Set(categoryIds)];
			if (uniqueIds.length !== categoryIds.length) {
				throw new HttpBadRequestError(ErrorCode.CATEGORY_NOT_FOUND);
			}

			const count = await this.categoryRepository.count({
				id: In(uniqueIds),
				isActive: true,
			});

			if (count !== uniqueIds.length) {
				throw new HttpBadRequestError(ErrorCode.CATEGORY_NOT_FOUND);
			}
		}
	}

	private async enrichWithMedia(profile: GreenProfile): Promise<GreenProfile> {
		return enrichGreenProfileWithMedia(profile, this.mediaRepository);
	}

	private generateSlug(name: string): string {
		return (
			name
				.toLowerCase()
				.normalize('NFD')
				.replace(/[\u0300-\u036f]/g, '')
				.replace(/[đĐ]/g, 'd')
				.replace(/[^a-z0-9\s-]/g, '')
				.replace(/\s+/g, '-')
				.replace(/-+/g, '-')
				.trim() +
			'-' +
			uuidv4()
		);
	}

	async getPublicProfileBySlug(slug: string): Promise<GreenProfile> {
		const greenProfile = await this.greenProfileRepository.findOneWithCoords(
			{ slug, isPublished: true },
			['certifications', 'products'],
		);

		if (!greenProfile) {
			throw new HttpNotFoundError(ErrorCode.GREEN_PROFILE_NOT_FOUND);
		}

		greenProfile.certifications = (greenProfile.certifications || []).filter(
			(c) => c.status === CertificationStatus.APPROVED,
		);
		greenProfile.products = (greenProfile.products || []).filter(
			(p) => p.status === ProductStatus.ACTIVE,
		);

		return this.enrichWithMedia(greenProfile);
	}

	async getRatingBreakdown(slug: string): Promise<RatingBreakdown> {
		const greenProfile = await this.greenProfileRepository.findOne({
			slug,
			isPublished: true,
		});
		if (!greenProfile) {
			throw new HttpNotFoundError(ErrorCode.GREEN_PROFILE_NOT_FOUND);
		}
		return this.productReviewRepository.getRatingBreakdownByGreenProfile(
			greenProfile.id,
		);
	}

	async togglePublishStatus(
		userId: string,
		organizationId?: string,
	): Promise<GreenProfile> {
		if (organizationId) {
			await this.assertUserIsOrgAdmin(userId, organizationId);
		}

		const checkCondition = organizationId ? { organizationId } : { userId };

		const greenProfile =
			await this.greenProfileRepository.findOneWithCoords(checkCondition);

		if (!greenProfile) {
			throw new HttpNotFoundError(ErrorCode.GREEN_PROFILE_NOT_FOUND);
		}

		const updated = await this.greenProfileRepository.update(greenProfile.id, {
			isPublished: !greenProfile.isPublished,
		});

		if (!updated) {
			throw new HttpNotFoundError(ErrorCode.GREEN_PROFILE_NOT_FOUND);
		}

		const result = Object.assign(updated, {
			latitude: (greenProfile as GreenProfileWithCoords).latitude,
			longitude: (greenProfile as GreenProfileWithCoords).longitude,
		}) as GreenProfileWithCoords;
		return this.enrichWithMedia(result);
	}
}
