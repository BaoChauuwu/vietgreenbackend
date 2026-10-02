import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StatsController } from './stats.controller';
import { StatsService } from './stats.service';
import { QrScan } from '@app/database/typeorm/entities/agriculture/qr-scan.entity';
import { QrScanRepository } from '@app/database/typeorm/repositories/qr-scan.repository';

@Module({
	imports: [TypeOrmModule.forFeature([QrScan])],
	controllers: [StatsController],
	providers: [StatsService, QrScanRepository],
	exports: [StatsService],
})
export class StatsModule {}
