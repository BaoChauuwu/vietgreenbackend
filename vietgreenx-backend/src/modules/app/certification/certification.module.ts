import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CertificationService } from './certification.service';
import { CertificationController } from './certification.controller';
import { Certification } from '@app/database/typeorm/entities/agriculture/certification.entity';
import { CertificationRepository } from '@app/database/typeorm/repositories/certification.repository';
import { GreenProfileModule } from '../green-profile/green-profile.module';
import { AppAuthModule } from '../app-auth/app-auth.module';

@Module({
	imports: [
		TypeOrmModule.forFeature([Certification]),
		AppAuthModule,
		GreenProfileModule,
	],
	controllers: [CertificationController],
	providers: [CertificationService, CertificationRepository],
	exports: [CertificationRepository, CertificationService],
})
export class CertificationModule {}
