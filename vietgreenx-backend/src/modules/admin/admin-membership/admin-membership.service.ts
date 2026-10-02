import { Injectable } from '@nestjs/common';
import { MembershipTierRepository } from '@app/database/typeorm/repositories/membership-tier.repository';
import { MembershipTier } from '@app/database/typeorm/entities/system/membership-tier.entity';
import {
	ErrorCode,
	HttpBadRequestError,
	HttpNotFoundError,
} from '@app/common/errors';
import { CreateMembershipTierRequestDto } from './dto/requests/create-membership-tier.request.dto';
import { UpdateMembershipTierRequestDto } from './dto/requests/update-membership-tier.request.dto';

@Injectable()
export class AdminMembershipService {
	constructor(
		private readonly membershipTierRepository: MembershipTierRepository,
	) {}

	async findAll(): Promise<MembershipTier[]> {
		return this.membershipTierRepository.findAll({
			order: { sortOrder: 'ASC', createdAt: 'ASC' },
		});
	}

	async findOne(id: string): Promise<MembershipTier> {
		const tier = await this.membershipTierRepository.findById(id);
		if (!tier) throw new HttpNotFoundError(ErrorCode.PLAN_NOT_FOUND);
		return tier;
	}

	async create(dto: CreateMembershipTierRequestDto): Promise<MembershipTier> {
		const existing = await this.membershipTierRepository.findOne({
			plan: dto.plan,
		});
		if (existing) {
			throw new HttpBadRequestError(ErrorCode.MEMBERSHIP_TIER_ALREADY_EXISTS);
		}
		return this.membershipTierRepository.create({
			plan: dto.plan,
			displayName: dto.displayName,
			description: dto.description ?? null,
			priceMonthly: dto.priceMonthly,
			priceYearly: dto.priceYearly ?? null,
			qrLimit: dto.qrLimit,
			productLimit: dto.productLimit,
			tradePostAllowed: dto.tradePostAllowed,
			sortOrder: dto.sortOrder ?? 0,
		});
	}

	async update(
		id: string,
		dto: UpdateMembershipTierRequestDto,
	): Promise<MembershipTier> {
		await this.findOne(id);
		const updated = await this.membershipTierRepository.update(id, dto);
		if (!updated) throw new HttpNotFoundError(ErrorCode.PLAN_NOT_FOUND);
		return updated;
	}
}
