import { Injectable } from '@nestjs/common';
import { BaseRepository } from './base.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductCertification } from '../entities/agriculture/product-certification.entity';

@Injectable()
export class ProductCertificationRepository extends BaseRepository<ProductCertification> {
	constructor(
		@InjectRepository(ProductCertification)
		private readonly productCertificationRepo: Repository<ProductCertification>,
	) {
		super(productCertificationRepo);
	}
}
