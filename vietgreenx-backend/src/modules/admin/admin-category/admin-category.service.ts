import { Injectable } from '@nestjs/common';
import { CategoryRepository } from '@app/database/typeorm/repositories/category.repository';
import { CreateCategoryRequestDto } from './dto/requests/create-category.request.dto';
import { UpdateCategoryRequestDto } from './dto/requests/update-category.request.dto';
import { HttpNotFoundError } from '@app/common/errors/not-found.error';
import { HttpBadRequestError } from '@app/common/errors/bad-request.error';
import { ErrorCode } from '@app/common/errors/error-code';
import { Category } from '@app/database/typeorm/entities/agriculture/category.entity';
import { Not } from 'typeorm';
import { PaginationDto } from '@app/common/dtos/paginationDto';
import { Pagination } from '@app/common/types/request-response.type';

@Injectable()
export class AdminCategoryService {
	constructor(private readonly categoryRepository: CategoryRepository) {}

	async create(dto: CreateCategoryRequestDto): Promise<Category> {
		const existingCategory = await this.categoryRepository.findOne(
			{ slug: dto.slug },
			[],
			undefined,
			{ withDeleted: true },
		);
		if (existingCategory) {
			throw new HttpBadRequestError(ErrorCode.CATEGORY_SLUG_EXISTS);
		}

		if (dto.parentId) {
			const parentCategory = await this.categoryRepository.findById(
				dto.parentId,
			);
			if (!parentCategory) {
				throw new HttpNotFoundError(ErrorCode.CATEGORY_NOT_FOUND);
			}
		}

		return await this.categoryRepository.create(dto);
	}

	async findAll(pagination: PaginationDto): Promise<Pagination<Category>> {
		return await this.categoryRepository.findWithPagination(
			pagination.page,
			pagination.limit,
			{
				relations: ['parent'],
				order: { sortOrder: 'ASC', createdAt: 'DESC' },
			},
		);
	}

	async findOne(id: string): Promise<Category> {
		const category = await this.categoryRepository.findById(id, ['parent']);

		if (!category) {
			throw new HttpNotFoundError(ErrorCode.CATEGORY_NOT_FOUND);
		}

		return category;
	}

	async update(id: string, dto: UpdateCategoryRequestDto): Promise<Category> {
		const category = await this.findOne(id);

		if (dto.slug && dto.slug !== category.slug) {
			const existingCategory = await this.categoryRepository.findOne(
				{ slug: dto.slug, id: Not(id) },
				[],
				undefined,
				{ withDeleted: true },
			);
			if (existingCategory) {
				throw new HttpBadRequestError(ErrorCode.CATEGORY_SLUG_EXISTS);
			}
		}

		if (dto.parentId) {
			if (dto.parentId === id) {
				throw new HttpBadRequestError(ErrorCode.CATEGORY_PARENT_INVALID);
			}
			const parentCategory = await this.categoryRepository.findById(
				dto.parentId,
			);
			if (!parentCategory) {
				throw new HttpNotFoundError(ErrorCode.CATEGORY_NOT_FOUND);
			}

			let currentParentId = parentCategory.parentId;
			const visited = new Set<string>();
			visited.add(id);

			while (currentParentId) {
				if (visited.has(currentParentId)) {
					throw new HttpBadRequestError(ErrorCode.CATEGORY_PARENT_INVALID);
				}
				visited.add(currentParentId);

				const p = await this.categoryRepository.findById(currentParentId);
				if (!p) break;
				currentParentId = p.parentId;
			}
		}

		const updated = await this.categoryRepository.update(id, dto);
		if (!updated) {
			throw new HttpNotFoundError(ErrorCode.CATEGORY_NOT_FOUND);
		}
		return updated;
	}

	async hide(id: string): Promise<Category> {
		const category = await this.findOne(id);

		if (category.isActive === false) {
			return category;
		}

		if (category.productCount > 0) {
			throw new HttpBadRequestError(ErrorCode.CATEGORY_HAS_PRODUCTS);
		}

		const activeChildrenCount = await this.categoryRepository.count({
			parentId: id,
			isActive: true,
		});
		if (activeChildrenCount > 0) {
			throw new HttpBadRequestError(ErrorCode.CATEGORY_HAS_CHILDREN);
		}

		const updated = await this.categoryRepository.update(id, {
			isActive: false,
		});
		if (!updated) throw new HttpNotFoundError(ErrorCode.CATEGORY_NOT_FOUND);
		return updated;
	}
}
