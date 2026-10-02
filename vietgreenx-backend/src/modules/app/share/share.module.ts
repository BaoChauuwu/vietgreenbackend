import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Share } from '@app/database/typeorm/entities/engagement/share.entity';
import { Post } from '@app/database/typeorm/entities/content/post.entity';
import { PostRepository } from '@app/database/typeorm/repositories/post.repository';
import { ShareService } from './share.service';
import { ShareController } from './share.controller';
import { AppAuthModule } from '@app/modules/app/app-auth/app-auth.module';
import { AppPostModule } from '@app/modules/app/post/post.module';

@Module({
	imports: [
		TypeOrmModule.forFeature([Share, Post]),
		AppAuthModule,
		AppPostModule,
	],
	controllers: [ShareController],
	providers: [ShareService, PostRepository],
})
export class ShareModule {}
