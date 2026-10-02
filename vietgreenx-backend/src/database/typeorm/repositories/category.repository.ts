import { Injectable } from '@nestjs/common';
import { BaseRepository } from './base.repository';
import { Category } from '../entities/agriculture/category.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class CategoryRepository extends BaseRepository<Category> {
	constructor(
		@InjectRepository(Category)
		private readonly categoryRepo: Repository<Category>,
	) {
		super(categoryRepo);
	}
}
