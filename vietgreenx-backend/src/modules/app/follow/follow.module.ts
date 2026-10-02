import { Module } from '@nestjs/common';
import { Follow } from '@app/database/typeorm/entities/social-graph/follow.entity';
import { Profile } from '@app/database/typeorm/entities/identity/profile.entity';
import { User } from '@app/database/typeorm/entities/identity/user.entity';
import { FollowService } from './follow.service';
import { FollowController } from './follow.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProfileRepository } from '@app/database/typeorm/repositories/profile.repository';
import { UserRepository } from '@app/database/typeorm/repositories/user.repository';
import { FollowRepository } from '@app/database/typeorm/repositories/follow.repository';
import { OrganizationRepository } from '@app/database/typeorm/repositories/organization.repository';
import { BlockModule } from '../block/block.module';
import { Organization } from '@app/database/typeorm/entities';
import { EventEmitterModule } from '@nestjs/event-emitter';

@Module({
	imports: [
		TypeOrmModule.forFeature([Follow, Profile, User, Organization]),
		BlockModule,
		EventEmitterModule,
	],
	controllers: [FollowController],
	providers: [
		FollowService,
		ProfileRepository,
		UserRepository,
		FollowRepository,
		OrganizationRepository,
	],
})
export class FollowModule {}
