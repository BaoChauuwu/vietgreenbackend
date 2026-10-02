import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '@app/database/typeorm/entities';
import { UserSeedService } from './user-seed.service';

@Module({
	imports: [TypeOrmModule.forFeature([User])],
	providers: [UserSeedService],
	exports: [UserSeedService],
})
export class UserSeedModule {}
