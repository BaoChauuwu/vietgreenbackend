import { Injectable } from '@nestjs/common';
import { BaseRepository } from './base.repository';
import { SupplierReview } from '../entities/agriculture/supplier-review.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class SupplierReviewRepository extends BaseRepository<SupplierReview> {
	constructor(
		@InjectRepository(SupplierReview)
		private readonly supplierReviewRepo: Repository<SupplierReview>,
	) {
		super(supplierReviewRepo);
	}

	async getAggregated(
		supplierId: string,
	): Promise<{ avgRating: number; reviewCount: number }> {
		const result = await this.supplierReviewRepo
			.createQueryBuilder('r')
			.select('ROUND(AVG(r.rating)::numeric, 1)', 'avgRating')
			.addSelect('COUNT(*)', 'reviewCount')
			.where('r.supplierId = :supplierId', { supplierId })
			.andWhere('r.isHidden = false')
			.getRawOne();

		return {
			avgRating: parseFloat(result?.avgRating ?? '0'),
			reviewCount: parseInt(result?.reviewCount ?? '0', 10),
		};
	}
}
