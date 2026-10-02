import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '@app/database/typeorm/entities/identity/user.entity';
import { Notification } from '@app/database/typeorm/entities/notification/notification.entity';
import { MembershipTier } from '@app/database/typeorm/entities/system/membership-tier.entity';
import { UserRepository } from '@app/database/typeorm/repositories/user.repository';
import { NotificationRepository } from '@app/database/typeorm/repositories/notification.repository';
import { MembershipTierRepository } from '@app/database/typeorm/repositories/membership-tier.repository';
import { AppAuthModule } from '@app/modules/app/app-auth/app-auth.module';
import { MembershipService } from './membership.service';
import { MembershipController } from './membership.controller';

@Module({
	imports: [
		TypeOrmModule.forFeature([User, Notification, MembershipTier]),
		AppAuthModule,
	],
	controllers: [MembershipController],
	providers: [
		MembershipService,
		UserRepository,
		NotificationRepository,
		MembershipTierRepository,
	],
	exports: [MembershipService],
})
export class MembershipModule {}
