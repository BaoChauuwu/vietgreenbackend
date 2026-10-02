import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TraceController } from './trace.controller';
import { TraceService } from './trace.service';
import { PublicTraceTokenRepository } from '@app/database/typeorm/repositories/public-trace-token.repository';
import { QrScanRepository } from '@app/database/typeorm/repositories/qr-scan.repository';
import { ProductCertificationRepository } from '@app/database/typeorm/repositories/product-certification.repository';
import { CropSeasonRepository } from '@app/database/typeorm/repositories/crop-season.repository';
import { ProductReviewRepository } from '@app/database/typeorm/repositories/product-review.repository';
import { PublicTraceToken } from '@app/database/typeorm/entities/agriculture/public-trace-token.entity';
import { QrScan } from '@app/database/typeorm/entities/agriculture/qr-scan.entity';
import { ProductCertification } from '@app/database/typeorm/entities/agriculture/product-certification.entity';
import { CropSeason } from '@app/database/typeorm/entities/agriculture/crop-season.entity';
import { Product } from '@app/database/typeorm/entities/agriculture/product.entity';
import { Batch } from '@app/database/typeorm/entities/agriculture/batch.entity';
import { ProductReview } from '@app/database/typeorm/entities/agriculture/product-review.entity';
import { Media } from '@app/database/typeorm/entities/media/media.entity';
import { MediaRepository } from '@app/database/typeorm/repositories/media.repository';
import { AppAuthModule } from '@app/modules/app/app-auth/app-auth.module';
import { ProductionLogModule } from '../production-log/production-log.module';
import { HashModule } from '../hash/hash.module';

@Module({
	imports: [
		TypeOrmModule.forFeature([
			PublicTraceToken,
			QrScan,
			ProductCertification,
			CropSeason,
			Product,
			Batch,
			ProductReview,
			Media,
		]),
		ProductionLogModule,
		AppAuthModule,
		HashModule,
	],
	controllers: [TraceController],
	providers: [
		TraceService,
		PublicTraceTokenRepository,
		QrScanRepository,
		ProductCertificationRepository,
		CropSeasonRepository,
		ProductReviewRepository,
		MediaRepository,
	],
	exports: [TraceService],
})
export class TraceModule {}
