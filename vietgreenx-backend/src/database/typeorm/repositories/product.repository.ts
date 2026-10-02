import { Injectable } from '@nestjs/common';
import { BaseRepository } from './base.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../entities/agriculture/product.entity';

@Injectable()
export class ProductRepository extends BaseRepository<Product> {
	constructor(
		@InjectRepository(Product)
		private readonly productRepo: Repository<Product>,
	) {
		super(productRepo);
	}
}
