import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CropSeasonService } from './crop-season.service';
import { CropSeasonRepository } from '@app/database/typeorm/repositories/crop-season.repository';
import { CropSeasonController } from './crop-season.controller';
import { AppAuthModule } from '../app-auth/app-auth.module';
import { CropSeason } from '@app/database/typeorm/entities/agriculture/crop-season.entity';
import { GreenProfile } from '@app/database/typeorm/entities/agriculture/green-profile.entity';
import { GreenProfileRepository } from '@app/database/typeorm/repositories/green-profile.repository';
import { Product } from '@app/database/typeorm/entities/agriculture/product.entity';
import { ProductRepository } from '@app/database/typeorm/repositories/product.repository';
import { OrganizationMember } from '@app/database/typeorm/entities/identity/organization-member.entity';
import { OrganizationMemberRepository } from '@app/database/typeorm/repositories/organization-member.repository';
import { ProductionLog } from '@app/database/typeorm/entities/agriculture/production-log.entity';
import { ProductionLogRepository } from '@app/database/typeorm/repositories/production-log.repository';
import { Batch } from '@app/database/typeorm/entities/agriculture/batch.entity';
import { BatchRepository } from '@app/database/typeorm/repositories/batch.repository';
import { GreenProfileModule } from '../green-profile/green-profile.module';

@Module({
	imports: [
		TypeOrmModule.forFeature([
			CropSeason,
			GreenProfile,
			Product,
			OrganizationMember,
			ProductionLog,
			Batch,
		]),
		AppAuthModule,
		GreenProfileModule,
	],
	controllers: [CropSeasonController],
	providers: [
		CropSeasonService,
		CropSeasonRepository,
		GreenProfileRepository,
		ProductRepository,
		OrganizationMemberRepository,
		ProductionLogRepository,
		BatchRepository,
	],
	exports: [CropSeasonService],
})
export class CropSeasonModule {}
