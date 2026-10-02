import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from '@app/database/typeorm/entities/agriculture/product.entity';
import { Category } from '@app/database/typeorm/entities/agriculture/category.entity';
import { Media } from '@app/database/typeorm/entities/media/media.entity';
import { GreenProfile } from '@app/database/typeorm/entities/agriculture/green-profile.entity';
import { Certification } from '@app/database/typeorm/entities/agriculture/certification.entity';
import { ProductCertification } from '@app/database/typeorm/entities/agriculture/product-certification.entity';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { ProductRepository } from '@app/database/typeorm/repositories/product.repository';
import { CategoryRepository } from '@app/database/typeorm/repositories/category.repository';
import { MediaRepository } from '@app/database/typeorm/repositories/media.repository';
import { GreenProfileRepository } from '@app/database/typeorm/repositories/green-profile.repository';
import { CertificationRepository } from '@app/database/typeorm/repositories/certification.repository';
import { ProductCertificationRepository } from '@app/database/typeorm/repositories/product-certification.repository';
import { AppAuthModule } from '../app-auth/app-auth.module';
import { AppMediaModule } from '../media/media.module';

@Module({
	imports: [
		TypeOrmModule.forFeature([
			Product,
			Category,
			Media,
			GreenProfile,
			Certification,
			ProductCertification,
		]),
		AppAuthModule,
		AppMediaModule,
	],
	controllers: [ProductController],
	providers: [
		ProductService,
		ProductRepository,
		CategoryRepository,
		MediaRepository,
		GreenProfileRepository,
		CertificationRepository,
		ProductCertificationRepository,
	],
	exports: [ProductService],
})
export class AppProductModule {}
