import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VerificationRequest } from '@app/database/typeorm/entities/identity/verification-request.entity';
import { Organization } from '@app/database/typeorm/entities/identity/organization.entity';
import { OrganizationRepository } from '@app/database/typeorm/repositories/organization.repository';
import { VerificationRequestRepository } from '@app/database/typeorm/repositories/verification-request.repository';
import { AdminOrganizationService } from './admin-organization.service';
import { AdminOrganizationController } from './admin-organization.controller';
import { NotificationModule } from '@app/modules/app/notification/notification.module';

@Module({
	imports: [
		TypeOrmModule.forFeature([Organization, VerificationRequest]),
		NotificationModule,
	],
	controllers: [AdminOrganizationController],
	providers: [
		AdminOrganizationService,
		OrganizationRepository,
		VerificationRequestRepository,
	],
	exports: [AdminOrganizationService],
})
export class AdminOrganizationModule {}
