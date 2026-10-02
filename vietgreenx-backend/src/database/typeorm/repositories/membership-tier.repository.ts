import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from './base.repository';
import { MembershipTier } from '../entities/system/membership-tier.entity';

@Injectable()
export class MembershipTierRepository extends BaseRepository<MembershipTier> {
	constructor(
		@InjectRepository(MembershipTier)
		private readonly tierRepo: Repository<MembershipTier>,
	) {
		super(tierRepo);
	}
}
