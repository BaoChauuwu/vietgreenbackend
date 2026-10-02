import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '@app/database/typeorm/entities/identity/user.entity';
import { Profile } from '@app/database/typeorm/entities/identity/profile.entity';
import { Post } from '@app/database/typeorm/entities/content/post.entity';
import { Category } from '@app/database/typeorm/entities/agriculture/category.entity';
import { Follow } from '@app/database/typeorm/entities/social-graph/follow.entity';
import { DevFeedSeedService } from './dev-feed-seed.service';

@Module({
	imports: [TypeOrmModule.forFeature([User, Profile, Post, Category, Follow])],
	providers: [DevFeedSeedService],
	exports: [DevFeedSeedService],
})
export class DevFeedSeedModule {}
