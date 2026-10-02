import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrganizationController } from './organization.controller';
import { OrganizationService } from './organization.service';
import {
	Organization,
	OrganizationMember,
	VerificationRequest,
} from '@app/database/typeorm/entities';
import { OrganizationRepository } from '@app/database/typeorm/repositories/organization.repository';
import { OrganizationMemberRepository } from '@app/database/typeorm/repositories/organization-member.repository';
import { VerificationRequestRepository } from '@app/database/typeorm/repositories/verification-request.repository';
import { User } from '@app/database/typeorm/entities/identity/user.entity';
import { UserRepository } from '@app/database/typeorm/repositories/user.repository';
import { AppAuthModule } from '@app/modules/app/app-auth/app-auth.module';

@Module({
	imports: [
		TypeOrmModule.forFeature([
			Organization,
			OrganizationMember,
			VerificationRequest,
			User,
		]),
		AppAuthModule,
	],
	controllers: [OrganizationController],
	providers: [
		OrganizationService,
		OrganizationRepository,
		OrganizationMemberRepository,
		VerificationRequestRepository,
		UserRepository,
	],
	exports: [OrganizationService],
})
export class OrganizationModule {}
