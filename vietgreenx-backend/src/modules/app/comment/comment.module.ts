import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommentService } from './comment.service';
import { CommentController } from './comment.controller';
import { Comment } from '@app/database/typeorm/entities/engagement/comment.entity';
import { Post } from '@app/database/typeorm/entities/content/post.entity';
import { Reaction } from '@app/database/typeorm/entities/engagement/reaction.entity';
import { CommentRepository } from '@app/database/typeorm/repositories/comment.repository';
import { PostRepository } from '@app/database/typeorm/repositories/post.repository';
import { ReactionRepository } from '@app/database/typeorm/repositories/reaction.repository';
import { AppAuthModule } from '@app/modules/app/app-auth/app-auth.module';
import { AppPostModule } from '@app/modules/app/post/post.module';

@Module({
	imports: [
		TypeOrmModule.forFeature([Comment, Post, Reaction]),
		AppAuthModule,
		AppPostModule,
	],
	controllers: [CommentController],
	providers: [
		CommentService,
		CommentRepository,
		PostRepository,
		ReactionRepository,
	],
})
export class CommentModule {}
