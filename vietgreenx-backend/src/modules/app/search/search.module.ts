import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SearchService } from './search.service';
import { SearchController } from './search.controller';
import { User, Post, Product } from '@app/database/typeorm/entities';
import { UserRepository } from '@app/database/typeorm/repositories/user.repository';
import { PostRepository } from '@app/database/typeorm/repositories/post.repository';
import { ProductRepository } from '@app/database/typeorm/repositories/product.repository';
import { BlockModule } from '../block/block.module';
import { AppPostModule } from '../post/post.module';
import { AppAuthModule } from '../app-auth/app-auth.module';

@Module({
	imports: [
		TypeOrmModule.forFeature([User, Post, Product]),
		BlockModule,
		AppPostModule,
		AppAuthModule,
	],
	controllers: [SearchController],
	providers: [SearchService, UserRepository, PostRepository, ProductRepository],
})
export class SearchModule {}
