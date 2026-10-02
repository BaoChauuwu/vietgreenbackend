import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppAuthController } from './app-auth.controller';
import { AppAuthService } from './app-auth.service';
import { User } from '@app/database/typeorm/entities/identity/user.entity';
import { UserSession } from '@app/database/typeorm/entities/identity/user-session.entity';
import { Profile } from '@app/database/typeorm/entities/identity/profile.entity';
import { FcmDevice } from '@app/database/typeorm/entities/identity/fcm-device.entity';
import { UserRepository } from '@app/database/typeorm/repositories/user.repository';
import { UserSessionRepository } from '@app/database/typeorm/repositories/user-session.repository';
import { FcmDeviceRepository } from '@app/database/typeorm/repositories/fcm-device.repository';
import { AppAuthGuard } from './app-auth.guard';
import { OptionalAppAuthGuard } from './optional-app-auth.guard';
import { StatsModule } from '@app/modules/app/stats/stats.module';

@Module({
	imports: [
		TypeOrmModule.forFeature([User, UserSession, Profile, FcmDevice]),
		StatsModule,
	],
	controllers: [AppAuthController],
	providers: [
		AppAuthService,
		AppAuthGuard,
		OptionalAppAuthGuard,
		UserRepository,
		UserSessionRepository,
		FcmDeviceRepository,
	],
	exports: [AppAuthService, AppAuthGuard, OptionalAppAuthGuard],
})
export class AppAuthModule {}
