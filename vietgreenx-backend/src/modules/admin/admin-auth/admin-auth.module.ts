import { Module } from '@nestjs/common';
import { AdminAuthService } from './admin-auth.service';
import { AdminAuthController } from './admin-auth.controller';
import { User } from '@app/database/typeorm/entities/identity/user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserRepository } from '@app/database/typeorm/repositories/user.repository';
import { ServicesModule } from '@app/services/services.module';

@Module({
	imports: [TypeOrmModule.forFeature([User]), ServicesModule],
	controllers: [AdminAuthController],
	providers: [AdminAuthService, UserRepository],
})
export class AdminAuthModule {}
