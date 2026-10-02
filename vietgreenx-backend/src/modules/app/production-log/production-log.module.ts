import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductionLogService } from './production-log.service';
import { ProductionLogController } from './production-log.controller';
import { ProductionLogRepository } from '@app/database/typeorm/repositories/production-log.repository';
import { ProductionLogNoteRepository } from '@app/database/typeorm/repositories/note.repository';
import { ProductionLog } from '@app/database/typeorm/entities/agriculture/production-log.entity';
import { ProductionLogNote } from '@app/database/typeorm/entities/agriculture/production-log-note.entity';
import { AppAuthModule } from '../app-auth/app-auth.module';

import { CropSeasonModule } from '../crop-season/crop-season.module';
import { AppMediaModule } from '../media/media.module';

@Module({
	imports: [
		TypeOrmModule.forFeature([ProductionLog, ProductionLogNote]),
		AppAuthModule,
		CropSeasonModule,
		AppMediaModule,
	],
	controllers: [ProductionLogController],
	providers: [
		ProductionLogService,
		ProductionLogRepository,
		ProductionLogNoteRepository,
	],
	exports: [ProductionLogService],
})
export class ProductionLogModule {}
