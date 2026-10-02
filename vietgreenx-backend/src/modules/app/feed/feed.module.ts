import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Post } from '@app/database/typeorm/entities/content/post.entity';
import { Follow } from '@app/database/typeorm/entities/social-graph/follow.entity';
import { Profile } from '@app/database/typeorm/entities/identity/profile.entity';
import { PostRepository } from '@app/database/typeorm/repositories/post.repository';
import { ProfileRepository } from '@app/database/typeorm/repositories/profile.repository';
import { FeedController } from './feed.controller';
import { FeedService } from './feed.service';
import { FeedListener } from './feed.listener';
import { AppAuthModule } from '@app/modules/app/app-auth/app-auth.module';
import { AppPostModule } from '@app/modules/app/post/post.module';
import { BlockModule } from '@app/modules/app/block/block.module';

@Module({
	imports: [
		TypeOrmModule.forFeature([Post, Follow, Profile]),
		AppAuthModule,
		AppPostModule,
		BlockModule,
	],
	controllers: [FeedController],
	providers: [FeedService, FeedListener, PostRepository, ProfileRepository],
})
export class FeedModule {}
