import { Injectable } from '@nestjs/common';
import { CategoryRepository } from '@app/database/typeorm/repositories/category.repository';
import { Category } from '@app/database/typeorm/entities/agriculture/category.entity';
import { HttpNotFoundError } from '@app/common/errors/not-found.error';
import { ErrorCode } from '@app/common/errors/error-code';
import { PaginationDto } from '@app/common/dtos/paginationDto';
import { Pagination } from '@app/common/types/request-response.type';

@Injectable()
export class CategoryService {
	constructor(private readonly categoryRepository: CategoryRepository) {}

	async findAll(pagination: PaginationDto): Promise<Pagination<Category>> {
		const page = Math.max(1, Math.floor(pagination.page));
		const limit = Math.max(1, Math.min(Math.floor(pagination.limit), 1000));
		const skip = (page - 1) * limit;

		const qb = this.categoryRepository
			.createQueryBuilder('category')
			.leftJoinAndSelect('category.parent', 'parent')
			.where('category.isActive = :isActive', { isActive: true })
			.andWhere('(category.parentId IS NULL OR parent.isActive = :isActive)', {
				isActive: true,
			})
			.orderBy('category.sortOrder', 'ASC')
			.addOrderBy('category.createdAt', 'DESC')
			.skip(skip)
			.take(limit);

		const [items, total] = await qb.getManyAndCount();
		const totalPage = limit > 0 ? Math.ceil(total / limit) : 0;

		return { page, limit, total, totalPage, items };
	}

	async findOne(id: string): Promise<Category> {
		const category = await this.categoryRepository.findById(id, ['parent']);
		if (!category || !category.isActive) {
			throw new HttpNotFoundError(ErrorCode.CATEGORY_NOT_FOUND);
		}
		if (category.parent && !category.parent.isActive) {
			category.parent = null;
		}
		return category;
	}
}
