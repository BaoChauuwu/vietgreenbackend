import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportService } from './report.service';
import { ReportController } from './report.controller';
import { Report } from '@app/database/typeorm/entities/moderation/report.entity';
import { Post } from '@app/database/typeorm/entities/content/post.entity';
import { Comment } from '@app/database/typeorm/entities/engagement/comment.entity';
import { Product } from '@app/database/typeorm/entities/agriculture/product.entity';
import { ReportRepository } from '@app/database/typeorm/repositories/report.repository';
import { PostRepository } from '@app/database/typeorm/repositories/post.repository';
import { CommentRepository } from '@app/database/typeorm/repositories/comment.repository';
import { ProductRepository } from '@app/database/typeorm/repositories/product.repository';
import { BlockModule } from '@app/modules/app/block/block.module';
import { AppAuthModule } from '@app/modules/app/app-auth/app-auth.module';

@Module({
	imports: [
		TypeOrmModule.forFeature([Report, Post, Comment, Product]),
		BlockModule,
		AppAuthModule,
	],
	controllers: [ReportController],
	providers: [
		ReportService,
		ReportRepository,
		PostRepository,
		CommentRepository,
		ProductRepository,
	],
})
export class ReportModule {}
