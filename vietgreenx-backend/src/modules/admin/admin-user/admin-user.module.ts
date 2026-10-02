import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '@app/database/typeorm/entities/identity/user.entity';
import { Notification } from '@app/database/typeorm/entities';
import { UserRepository } from '@app/database/typeorm/repositories/user.repository';
import { NotificationRepository } from '@app/database/typeorm/repositories/notification.repository';
import { AdminUserService } from './admin-user.service';
import { AdminUserController } from './admin-user.controller';
import { AppAuthModule } from '../../app/app-auth/app-auth.module';
import { MembershipModule } from '@app/modules/app/membership/membership.module';

@Module({
	imports: [
		TypeOrmModule.forFeature([User, Notification]),
		AppAuthModule,
		MembershipModule,
	],
	controllers: [AdminUserController],
	providers: [AdminUserService, UserRepository, NotificationRepository],
})
export class AdminUserModule {}
