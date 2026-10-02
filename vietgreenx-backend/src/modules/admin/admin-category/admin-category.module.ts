import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from '@app/database/typeorm/entities/agriculture/category.entity';
import { User } from '@app/database/typeorm/entities/identity/user.entity';
import { AdminCategoryController } from './admin-category.controller';
import { AdminCategoryService } from './admin-category.service';
import { CategoryRepository } from '@app/database/typeorm/repositories/category.repository';
import { UserRepository } from '@app/database/typeorm/repositories/user.repository';

@Module({
	imports: [TypeOrmModule.forFeature([Category, User])],
	controllers: [AdminCategoryController],
	providers: [AdminCategoryService, CategoryRepository, UserRepository],
	exports: [AdminCategoryService],
})
export class AdminCategoryModule {}
