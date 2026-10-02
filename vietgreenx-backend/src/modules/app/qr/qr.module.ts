import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QrController } from './qr.controller';
import { QrService } from './qr.service';
import { PublicTraceToken } from '@app/database/typeorm/entities/agriculture/public-trace-token.entity';
import { Batch } from '@app/database/typeorm/entities/agriculture/batch.entity';
import { PublicTraceTokenRepository } from '@app/database/typeorm/repositories/public-trace-token.repository';
import { BatchRepository } from '@app/database/typeorm/repositories/batch.repository';
import { AppAuthModule } from '../app-auth/app-auth.module';
import { QrQuotaModule } from '../qr-quota/qr-quota.module';

@Module({
	imports: [
		TypeOrmModule.forFeature([PublicTraceToken, Batch]),
		AppAuthModule,
		QrQuotaModule,
	],
	controllers: [QrController],
	providers: [QrService, PublicTraceTokenRepository, BatchRepository],
})
export class QrModule {}
