import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from '@app/database/typeorm/entities/agriculture/category.entity';
import { CategoryRepository } from '@app/database/typeorm/repositories/category.repository';
import { CategoryService } from './category.service';
import { CategoryController } from './category.controller';

@Module({
	imports: [TypeOrmModule.forFeature([Category])],
	controllers: [CategoryController],
	providers: [CategoryService, CategoryRepository],
})
export class CategoryModule {}
