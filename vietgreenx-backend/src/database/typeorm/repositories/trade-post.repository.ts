import { Injectable } from '@nestjs/common';
import { BaseRepository } from './base.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TradePost } from '../entities/agriculture/trade-post.entity';
import { TradeType } from '@app/common/enums/trade-type.enum';

export interface TradePostFilterOptions {
	tradeType?: TradeType;
	province?: string;
	categoryId?: string;
	minQuantity?: number;
	maxQuantity?: number;
	sort?: 'newest' | 'highest_quantity' | 'lowest_price';
	page?: number;
	limit?: number;
}

@Injectable()
export class TradePostRepository extends BaseRepository<TradePost> {
	constructor(
		@InjectRepository(TradePost)
		private readonly tradePostRepo: Repository<TradePost>,
	) {
		super(tradePostRepo);
	}

	async findWithFilters(
		options: TradePostFilterOptions,
	): Promise<{ data: TradePost[]; total: number }> {
		const {
			tradeType,
			province,
			categoryId,
			minQuantity,
			maxQuantity,
			sort = 'newest',
			page = 1,
			limit = 20,
		} = options;

		const qb = this.tradePostRepo
			.createQueryBuilder('tp')
			.leftJoinAndSelect('tp.posterUser', 'posterUser')
			.leftJoinAndSelect('posterUser.profile', 'profile')
			.leftJoinAndSelect('tp.category', 'category')
			.where('tp.deleted_at IS NULL')
			.andWhere('tp.status = :status', { status: 'active' })
			.andWhere('tp.expires_at > NOW()');

		if (tradeType) {
			qb.andWhere('tp.trade_type = :tradeType', { tradeType });
		}

		if (province) {
			qb.andWhere('tp.province = :province', { province });
		}

		if (categoryId) {
			qb.andWhere('tp.category_id = :categoryId', { categoryId });
		}

		if (minQuantity !== undefined) {
			qb.andWhere('tp.quantity >= :minQuantity', { minQuantity });
		}

		if (maxQuantity !== undefined) {
			qb.andWhere('tp.quantity <= :maxQuantity', { maxQuantity });
		}

		if (sort === 'newest') {
			qb.orderBy('tp.createdAt', 'DESC');
		} else if (sort === 'highest_quantity') {
			qb.orderBy('tp.quantity', 'DESC');
		} else if (sort === 'lowest_price') {
			qb.orderBy('tp.priceReference', 'ASC', 'NULLS LAST');
		}

		const offset = (page - 1) * limit;
		qb.skip(offset).take(limit);

		const [data, total] = await qb.getManyAndCount();
		return { data, total };
	}
}
