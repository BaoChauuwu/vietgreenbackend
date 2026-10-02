import { Module } from '@nestjs/common';
import { QrQuotaController } from './qr-quota.controller';
import { QrQuotaService } from './qr-quota.service';
import { QrQuotaTrackingRepository } from '@app/database/typeorm/repositories/qr-quota-tracking.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QrQuotaTracking } from '@app/database/typeorm/entities/agriculture/qr-quota-tracking.entity';
import { AppAuthModule } from '../app-auth/app-auth.module';

@Module({
	imports: [TypeOrmModule.forFeature([QrQuotaTracking]), AppAuthModule],
	controllers: [QrQuotaController],
	providers: [QrQuotaService, QrQuotaTrackingRepository],
	exports: [QrQuotaService],
})
export class QrQuotaModule {}
