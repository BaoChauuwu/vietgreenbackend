import { Module } from '@nestjs/common';
import { ReactionController } from './reaction.controller';
import { ReactionService } from './reaction.service';
import { ReactionRepository } from '@app/database/typeorm/repositories/reaction.repository';
import { CommentRepository } from '@app/database/typeorm/repositories/comment.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Reaction } from '@app/database/typeorm/entities/engagement/reaction.entity';
import { Comment } from '@app/database/typeorm/entities/engagement/comment.entity';
import { AppAuthModule } from '@app/modules/app/app-auth/app-auth.module';
import { AppPostModule } from '@app/modules/app/post/post.module';

@Module({
	imports: [
		TypeOrmModule.forFeature([Reaction, Comment]),
		AppAuthModule,
		AppPostModule,
	],
	controllers: [ReactionController],
	providers: [ReactionService, ReactionRepository, CommentRepository],
})
export class AppReactionModule {}
