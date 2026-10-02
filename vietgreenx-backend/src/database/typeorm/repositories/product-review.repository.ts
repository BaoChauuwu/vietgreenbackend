import { Injectable } from '@nestjs/common';
import { BaseRepository } from './base.repository';
import { ProductReview } from '../entities';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

export interface RatingBreakdown {
	'1': number;
	'2': number;
	'3': number;
	'4': number;
	'5': number;
}

@Injectable()
export class ProductReviewRepository extends BaseRepository<ProductReview> {
	constructor(
		@InjectRepository(ProductReview)
		private readonly productReviewRepo: Repository<ProductReview>,
	) {
		super(productReviewRepo);
	}

	async getRatingBreakdownByGreenProfile(
		greenProfileId: string,
	): Promise<RatingBreakdown> {
		const rows: { rating: string; count: string }[] =
			await this.productReviewRepo.query(
				`
			SELECT r.rating::text, COUNT(*)::text AS count
			FROM agriculture.product_reviews r
			JOIN agriculture.public_trace_tokens t ON t.id = r.token_id
			JOIN agriculture.products p            ON p.id = COALESCE(t.product_id, (
				SELECT b.product_id FROM agriculture.batches b WHERE b.id = t.batch_id
			))
			WHERE p.green_profile_id = $1
			  AND r.is_hidden = false
			GROUP BY r.rating
		`,
				[greenProfileId],
			);

		const breakdown: RatingBreakdown = {
			'1': 0,
			'2': 0,
			'3': 0,
			'4': 0,
			'5': 0,
		};
		for (const row of rows) {
			const key = row.rating as keyof RatingBreakdown;
			if (key in breakdown) breakdown[key] = parseInt(row.count, 10);
		}
		return breakdown;
	}
}
