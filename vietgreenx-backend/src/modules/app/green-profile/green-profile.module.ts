import { Module } from '@nestjs/common';
import { GreenProfileService } from './green-profile.service';
import { GreenProfileController } from './green-profile.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GreenProfile } from '@app/database/typeorm/entities/agriculture/green-profile.entity';
import { GreenProfileRepository } from '@app/database/typeorm/repositories/green-profile.repository';
import { CropSeason } from '@app/database/typeorm/entities/agriculture/crop-season.entity';
import { CropSeasonRepository } from '@app/database/typeorm/repositories/crop-season.repository';
import { GreenProfileAccessService } from './green-profile-access.service';
import { OrganizationMemberRepository } from '@app/database/typeorm/repositories/organization-member.repository';
import { OrganizationMember } from '@app/database/typeorm/entities/identity/organization-member.entity';
import { Category } from '@app/database/typeorm/entities/agriculture/category.entity';
import { CategoryRepository } from '@app/database/typeorm/repositories/category.repository';
import { Media } from '@app/database/typeorm/entities/media/media.entity';
import { MediaRepository } from '@app/database/typeorm/repositories/media.repository';
import { AppAuthModule } from '../app-auth/app-auth.module';
import { AppMediaModule } from '../media/media.module';
import { ProductReview } from '@app/database/typeorm/entities/agriculture/product-review.entity';
import { ProductReviewRepository } from '@app/database/typeorm/repositories/product-review.repository';

@Module({
	imports: [
		TypeOrmModule.forFeature([
			GreenProfile,
			CropSeason,
			OrganizationMember,
			Category,
			Media,
			ProductReview,
		]),
		AppAuthModule,
		AppMediaModule,
	],
	controllers: [GreenProfileController],
	providers: [
		GreenProfileService,
		GreenProfileRepository,
		CropSeasonRepository,
		GreenProfileAccessService,
		OrganizationMemberRepository,
		CategoryRepository,
		MediaRepository,
		ProductReviewRepository,
	],
	exports: [GreenProfileAccessService, OrganizationMemberRepository],
})
export class GreenProfileModule {}
