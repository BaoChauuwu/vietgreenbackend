import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductReviewService } from './product-review.service';
import { ProductReviewController } from './product-review.controller';
import { ProductReviewRepository } from '@app/database/typeorm/repositories/product-review.repository';
import { PublicTraceTokenRepository } from '@app/database/typeorm/repositories/public-trace-token.repository';
import { ProductRepository } from '@app/database/typeorm/repositories/product.repository';
import { OrganizationMemberRepository } from '@app/database/typeorm/repositories/organization-member.repository';
import { ProductReview, PublicTraceToken, Product, OrganizationMember } from '@app/database/typeorm/entities';
import { AppAuthModule } from '../app-auth/app-auth.module';

@Module({
	imports: [
		TypeOrmModule.forFeature([ProductReview, PublicTraceToken, Product, OrganizationMember]),
		AppAuthModule,
	],
	controllers: [ProductReviewController],
	providers: [
		ProductReviewService,
		ProductReviewRepository,
		PublicTraceTokenRepository,
		ProductRepository,
		OrganizationMemberRepository,
	],
	exports: [ProductReviewService],
})
export class ProductReviewModule {}
