import { Injectable } from '@nestjs/common';
import { GreenProfileRepository } from '@app/database/typeorm/repositories/green-profile.repository';
import { CropSeasonRepository } from '@app/database/typeorm/repositories/crop-season.repository';
import { GreenProfile, CropSeason } from '@app/database/typeorm/entities';
import {
	HttpNotFoundError,
	ErrorCode,
	HttpForbiddenError,
} from '@app/common/errors';
import { OrganizationMemberRepository } from '@app/database/typeorm/repositories/organization-member.repository';
import { OrgMemberStatus } from '@app/common/enums/org-member-status.enum';
import { OrgRole } from '@app/common/enums/org-role.enum';
import { MediaRepository } from '@app/database/typeorm/repositories/media.repository';
import { enrichGreenProfileWithMedia } from './green-profile.service';

@Injectable()
export class GreenProfileAccessService {
	constructor(
		private readonly greenProfileRepository: GreenProfileRepository,
		private readonly cropSeasonRepository: CropSeasonRepository,
		private readonly organizationMemberRepository: OrganizationMemberRepository,
		private readonly mediaRepository: MediaRepository,
	) {}

	async getGreenProfileForUser(
		userId: string,
		relations: string[] = [],
	): Promise<GreenProfile> {
		const profile = await this.greenProfileRepository.findOneWithCoords(
			{ userId },
			relations,
		);

		if (!profile) {
			throw new HttpNotFoundError(ErrorCode.GREEN_PROFILE_NOT_FOUND);
		}

		return enrichGreenProfileWithMedia(profile, this.mediaRepository);
	}

	async assertSeasonBelongsToUser(
		userId: string,
		seasonId: string,
	): Promise<CropSeason> {
		const cropSeason = await this.cropSeasonRepository.findOne(
			{ id: seasonId },
			['greenProfile'],
		);

		if (!cropSeason) {
			throw new HttpNotFoundError(ErrorCode.SEASON_NOT_FOUND);
		}

		if (!cropSeason.greenProfile || cropSeason.greenProfile.userId !== userId) {
			throw new HttpNotFoundError(ErrorCode.SEASON_NOT_FOUND);
		}

		return cropSeason;
	}

	async getGreenProfileForOrg(
		userId: string,
		organizationId: string,
		relations: string[] = [],
	): Promise<GreenProfile> {
		const member = await this.organizationMemberRepository.findOne({
			userId,
			organizationId,
			status: OrgMemberStatus.ACTIVE,
		});

		if (!member) {
			throw new HttpForbiddenError(ErrorCode.ORGANIZATION_NOT_MEMBER);
		}

		const profile = await this.greenProfileRepository.findOneWithCoords(
			{ organizationId },
			relations,
		);

		if (!profile) {
			throw new HttpNotFoundError(ErrorCode.GREEN_PROFILE_NOT_FOUND);
		}

		return enrichGreenProfileWithMedia(profile, this.mediaRepository);
	}

	async assertUserCanManageProfile(
		userId: string,
		profileId: string,
	): Promise<GreenProfile> {
		const profile = await this.greenProfileRepository.findOne({
			id: profileId,
		});

		if (!profile) {
			throw new HttpNotFoundError(ErrorCode.GREEN_PROFILE_NOT_FOUND);
		}

		if (profile.organizationId) {
			const member = await this.organizationMemberRepository.findOne({
				userId,
				organizationId: profile.organizationId,
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
		} else if (profile.userId !== userId) {
			throw new HttpForbiddenError(ErrorCode.GREEN_PROFILE_NOT_OWNED);
		}
		return profile;
	}
}
