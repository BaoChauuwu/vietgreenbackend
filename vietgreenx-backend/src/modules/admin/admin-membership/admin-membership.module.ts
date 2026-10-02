import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MembershipTier } from '@app/database/typeorm/entities/system/membership-tier.entity';
import { MembershipTierRepository } from '@app/database/typeorm/repositories/membership-tier.repository';
import { AdminMembershipService } from './admin-membership.service';
import { AdminMembershipController } from './admin-membership.controller';

@Module({
	imports: [TypeOrmModule.forFeature([MembershipTier])],
	controllers: [AdminMembershipController],
	providers: [AdminMembershipService, MembershipTierRepository],
	exports: [AdminMembershipService, MembershipTierRepository],
})
export class AdminMembershipModule {}
