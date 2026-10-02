import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppVersion } from '@app/database/typeorm/entities/system/app-version.entity';
import { AppVersionRepository } from '@app/database/typeorm/repositories/app-version.repository';
import { AdminDashboardService } from './admin-dashboard.service';
import { AdminDashboardController } from './admin-dashboard.controller';

@Module({
	imports: [TypeOrmModule.forFeature([AppVersion])],
	controllers: [AdminDashboardController],
	providers: [AdminDashboardService, AppVersionRepository],
})
export class AdminDashboardModule {}
