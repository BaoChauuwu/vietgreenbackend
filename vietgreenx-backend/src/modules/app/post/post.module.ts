import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Post } from '@app/database/typeorm/entities/content/post.entity';
import { PostMedia } from '@app/database/typeorm/entities/content/post-media.entity';
import { PostTag } from '@app/database/typeorm/entities/content/post-tag.entity';
import { Hashtag } from '@app/database/typeorm/entities/content/hashtag.entity';
import { PostHashtag } from '@app/database/typeorm/entities/content/post-hashtag.entity';
import { Media } from '@app/database/typeorm/entities/media/media.entity';
import { Category } from '@app/database/typeorm/entities/agriculture/category.entity';
import { Product } from '@app/database/typeorm/entities/agriculture/product.entity';
import { Profile } from '@app/database/typeorm/entities/identity/profile.entity';
import { Follow } from '@app/database/typeorm/entities/social-graph/follow.entity';
import { Reaction } from '@app/database/typeorm/entities/engagement/reaction.entity';
import { ReactionRepository } from '@app/database/typeorm/repositories/reaction.repository';
import { PostController } from './post.controller';
import { PostService } from './post.service';
import { PostRepository } from '@app/database/typeorm/repositories/post.repository';
import { CategoryRepository } from '@app/database/typeorm/repositories/category.repository';
import { MediaRepository } from '@app/database/typeorm/repositories/media.repository';
import { ProfileRepository } from '@app/database/typeorm/repositories/profile.repository';
import { AppAuthModule } from '@app/modules/app/app-auth/app-auth.module';
import { AppMediaModule } from '@app/modules/app/media/media.module';
import { BlockModule } from '@app/modules/app/block/block.module';
@Module({
	imports: [
		TypeOrmModule.forFeature([
			Post,
			PostMedia,
			PostTag,
			Hashtag,
			PostHashtag,
			Media,
			Category,
			Product,
			Profile,
			Follow,
			Reaction,
		]),
		AppAuthModule,
		AppMediaModule,
		BlockModule,
	],
	controllers: [PostController],
	providers: [
		PostService,
		PostRepository,
		CategoryRepository,
		MediaRepository,
		ProfileRepository,
		ReactionRepository,
	],
	exports: [PostService],
})
export class AppPostModule {}
