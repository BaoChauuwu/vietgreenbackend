import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Report } from '@app/database/typeorm/entities/moderation/report.entity';
import { ReportRepository } from '@app/database/typeorm/repositories/report.repository';
import { AdminModerationService } from './admin-moderation.service';
import { AdminModerationController } from './admin-moderation.controller';
import { AppAuthModule } from '@app/modules/app/app-auth/app-auth.module';
import { NotificationModule } from '@app/modules/app/notification/notification.module';

@Module({
	imports: [
		TypeOrmModule.forFeature([Report]),
		AppAuthModule,
		NotificationModule,
	],
	controllers: [AdminModerationController],
	providers: [AdminModerationService, ReportRepository],
})
export class AdminModerationModule {}
