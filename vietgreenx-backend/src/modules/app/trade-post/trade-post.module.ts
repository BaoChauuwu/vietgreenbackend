import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TradePost } from '@app/database/typeorm/entities/agriculture/trade-post.entity';
import { Category } from '@app/database/typeorm/entities/agriculture/category.entity';
import { Product } from '@app/database/typeorm/entities/agriculture/product.entity';
import { Media } from '@app/database/typeorm/entities/media/media.entity';
import { TradePostController } from './trade-post.controller';
import { TradePostService } from './trade-post.service';
import { TradePostRepository } from '@app/database/typeorm/repositories/trade-post.repository';
import { CategoryRepository } from '@app/database/typeorm/repositories/category.repository';
import { MediaRepository } from '@app/database/typeorm/repositories/media.repository';
import { AppAuthModule } from '../app-auth/app-auth.module';

@Module({
	imports: [
		TypeOrmModule.forFeature([TradePost, Category, Product, Media]),
		AppAuthModule,
	],
	controllers: [TradePostController],
	providers: [
		TradePostService,
		TradePostRepository,
		CategoryRepository,
		MediaRepository,
	],
	exports: [TradePostService],
})
export class TradePostModule {}
