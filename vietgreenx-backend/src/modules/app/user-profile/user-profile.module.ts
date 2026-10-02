import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserProfileController } from './user-profile.controller';
import { UserProfileService } from './user-profile.service';
import { Profile } from '@app/database/typeorm/entities/identity/profile.entity';
import { User } from '@app/database/typeorm/entities/identity/user.entity';
import { Media } from '@app/database/typeorm/entities/media/media.entity';
import { Quotation } from '@app/database/typeorm/entities/agriculture/quotation.entity';
import { ProfileRepository } from '@app/database/typeorm/repositories/profile.repository';
import { MediaRepository } from '@app/database/typeorm/repositories/media.repository';
import { UserRepository } from '@app/database/typeorm/repositories/user.repository';
import { QuotationRepository } from '@app/database/typeorm/repositories/quotation.repository';
import { AppAuthModule } from '@app/modules/app/app-auth/app-auth.module';
import { AppMediaModule } from '@app/modules/app/media/media.module';
import { BlockModule } from '@app/modules/app/block/block.module';

@Module({
	imports: [
		TypeOrmModule.forFeature([Profile, User, Media, Quotation]),
		AppAuthModule,
		AppMediaModule,
		BlockModule,
	],
	controllers: [UserProfileController],
	providers: [
		UserProfileService,
		ProfileRepository,
		MediaRepository,
		UserRepository,
		QuotationRepository,
	],
})
export class UserProfileModule {}
