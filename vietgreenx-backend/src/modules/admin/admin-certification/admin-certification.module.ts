import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Certification } from '@app/database/typeorm/entities/agriculture/certification.entity';
import { CertificationRepository } from '@app/database/typeorm/repositories/certification.repository';
import { AdminCertificationService } from './admin-certification.service';
import { AdminCertificationController } from './admin-certification.controller';
import { AppAuthModule } from '@app/modules/app/app-auth/app-auth.module';

@Module({
	imports: [TypeOrmModule.forFeature([Certification]), AppAuthModule],
	controllers: [AdminCertificationController],
	providers: [AdminCertificationService, CertificationRepository],
})
export class AdminCertificationModule {}
