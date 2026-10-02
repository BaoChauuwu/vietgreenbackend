import { Module } from '@nestjs/common';
import { BatchController } from './batch.controller';
import { BatchService } from './batch.service';
import { BatchRepository } from '@app/database/typeorm/repositories/batch.repository';
import { ProductRepository } from '@app/database/typeorm/repositories/product.repository';
import { CropSeasonRepository } from '@app/database/typeorm/repositories/crop-season.repository';
import { GreenProfileRepository } from '@app/database/typeorm/repositories/green-profile.repository';
import { ProductionLogRepository } from '@app/database/typeorm/repositories/production-log.repository';
import { PublicTraceTokenRepository } from '@app/database/typeorm/repositories/public-trace-token.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Batch } from '@app/database/typeorm/entities/agriculture/batch.entity';
import { Product } from '@app/database/typeorm/entities/agriculture/product.entity';
import { CropSeason } from '@app/database/typeorm/entities/agriculture/crop-season.entity';
import { GreenProfile } from '@app/database/typeorm/entities/agriculture/green-profile.entity';
import { ProductionLog } from '@app/database/typeorm/entities/agriculture/production-log.entity';
import { PublicTraceToken } from '@app/database/typeorm/entities/agriculture/public-trace-token.entity';
import { AppAuthModule } from '../app-auth/app-auth.module';
import { QrQuotaModule } from '../qr-quota/qr-quota.module';

@Module({
	imports: [
		TypeOrmModule.forFeature([
			Batch,
			Product,
			CropSeason,
			GreenProfile,
			ProductionLog,
			PublicTraceToken,
		]),
		AppAuthModule,
		QrQuotaModule,
	],
	controllers: [BatchController],
	providers: [
		BatchService,
		BatchRepository,
		ProductRepository,
		CropSeasonRepository,
		GreenProfileRepository,
		ProductionLogRepository,
		PublicTraceTokenRepository,
	],
	exports: [BatchService],
})
export class BatchModule {}
