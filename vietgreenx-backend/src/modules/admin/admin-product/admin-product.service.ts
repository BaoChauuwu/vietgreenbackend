import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ProductRepository } from '@app/database/typeorm/repositories/product.repository';
import { ProductStatus } from '@app/common/enums/product-status.enum';
import { ErrorCode, HttpNotFoundError } from '@app/common/errors';
import { AdminProductQueryRequestDto } from './dto/requests/admin-product-query.request.dto';
import { Pagination } from '@app/common/types/request-response.type';
import { Category, Profile, User } from '@app/database/typeorm/entities';

@Injectable()
export class AdminProductService {
	constructor(
		private readonly productRepository: ProductRepository,
		private readonly dataSource: DataSource,
	) {}

	async findAll(query: AdminProductQueryRequestDto): Promise<Pagination<any>> {
		const { page, limit, province, categoryId, status, hasQr } = query;
		const offset = (page - 1) * limit;

		const qb = this.dataSource
			.createQueryBuilder()
			.select([
				'p.id AS id',
				'p.name AS name',
				'p.status AS status',
				'p.province AS province',
				'p.category_id AS "categoryId"',
				'c.name_en AS "categoryNameEn"',
				'p.owner_user_id AS "ownerUserId"',
				'u.username AS "ownerUsername"',
				'pr.display_name AS "ownerDisplayName"',
				'p.created_at AS "createdAt"',
				'p.has_qr AS "hasQr"',
			])
			.from('agriculture.products', 'p')
			.leftJoin(Category, 'c', 'c.id = p.category_id')
			.leftJoin(User, 'u', 'u.id = p.owner_user_id')
			.leftJoin(Profile, 'pr', 'pr.user_id = p.owner_user_id')
			.where('p.deleted_at IS NULL');

		if (province) {
			qb.andWhere('p.province = :province', { province });
		}
		if (categoryId) {
			qb.andWhere('p.category_id = :categoryId', { categoryId });
		}
		if (status) {
			qb.andWhere('p.status = :status', { status });
		}
		if (hasQr === true) {
			qb.andWhere('p.has_qr = true');
		} else if (hasQr === false) {
			qb.andWhere('p.has_qr = false');
		}

		qb.orderBy('p.created_at', 'DESC');

		const total = await qb.getCount();
		const items = await qb.offset(offset).limit(limit).getRawMany();

		return {
			items,
			total,
			page,
			limit,
			totalPage: Math.ceil(total / limit),
		};
	}

	async findOne(id: string): Promise<any> {
		const row = await this.dataSource
			.createQueryBuilder()
			.select([
				'p.id AS id',
				'p.name AS name',
				'p.status AS status',
				'p.province AS province',
				'p.category_id AS "categoryId"',
				'c.name_en AS "categoryNameEn"',
				'p.owner_user_id AS "ownerUserId"',
				'u.username AS "ownerUsername"',
				'pr.display_name AS "ownerDisplayName"',
				'p.description AS description',
				'p.production_location AS "productionLocation"',
				'p.price_reference AS "priceReference"',
				'p.photo_media_ids AS "photoMediaIds"',
				'p.has_qr AS "hasQr"',
				'p.created_at AS "createdAt"',
				'p.updated_at AS "updatedAt"',
			])
			.from('agriculture.products', 'p')
			.leftJoin(Category, 'c', 'c.id = p.category_id')
			.leftJoin(User, 'u', 'u.id = p.owner_user_id')
			.leftJoin(Profile, 'pr', 'pr.user_id = p.owner_user_id')
			.where('p.id = :id', { id })
			.andWhere('p.deleted_at IS NULL')
			.getRawOne();

		if (!row) {
			throw new HttpNotFoundError(ErrorCode.PRODUCT_NOT_FOUND);
		}

		return row;
	}

	async hide(id: string): Promise<any> {
		const existing = await this.productRepository.findOne({ id });
		if (!existing) {
			throw new HttpNotFoundError(ErrorCode.PRODUCT_NOT_FOUND);
		}

		await this.productRepository.update(id, { status: ProductStatus.ARCHIVED });

		return this.findOne(id);
	}

	async getAuditLog(
		id: string,
		page: number,
		limit: number,
	): Promise<{
		items: any[];
		total: number;
		page: number;
		limit: number;
		totalPage: number;
	}> {
		const existing = await this.productRepository.findOne({ id });
		if (!existing) {
			throw new HttpNotFoundError(ErrorCode.PRODUCT_NOT_FOUND);
		}

		const offset = (page - 1) * limit;

		const [items, total] = await Promise.all([
			this.dataSource.query(
				`SELECT
					al.id,
					al.action,
					al.user_id        AS "userId",
					al.actor_role     AS "actorRole",
					al.ip_address     AS "ipAddress",
					al.metadata,
					al.created_at     AS "createdAt"
				FROM moderation.audit_logs al
				WHERE al.resource_type = 'Product'
				  AND al.resource_id   = $1
				ORDER BY al.created_at DESC
				LIMIT $2 OFFSET $3`,
				[id, limit, offset],
			),
			this.dataSource.query(
				`SELECT COUNT(*)::int AS total
				 FROM moderation.audit_logs
				 WHERE resource_type = 'Product' AND resource_id = $1`,
				[id],
			),
		]);

		return {
			items,
			total: total[0].total,
			page,
			limit,
			totalPage: Math.ceil(total[0].total / limit),
		};
	}
}
