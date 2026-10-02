import { Injectable } from '@nestjs/common';
import { SavedSupplierRepository } from '@app/database/typeorm/repositories/saved-supplier.repository';
import { SupplierReviewRepository } from '@app/database/typeorm/repositories/supplier-review.repository';
import { OrderRepository } from '@app/database/typeorm/repositories/order.repository';
import { UserRepository } from '@app/database/typeorm/repositories/user.repository';
import { MediaRepository } from '@app/database/typeorm/repositories/media.repository';
import { HttpBadRequestError, HttpNotFoundError } from '@app/common/errors';
import { ErrorCode } from '@app/common/errors/error-code';
import { CreateSupplierReviewRequestDto } from './dto/requests/create-supplier-review.request.dto';
import { PaginationDto } from '@app/common/dtos/paginationDto';
import { OrderStatus } from '@app/common/enums/order-status.enum';

@Injectable()
export class SupplierService {
	constructor(
		private readonly savedSupplierRepository: SavedSupplierRepository,
		private readonly supplierReviewRepository: SupplierReviewRepository,
		private readonly orderRepository: OrderRepository,
		private readonly userRepository: UserRepository,
		private readonly mediaRepository: MediaRepository,
	) {}

	// ─── Saved Suppliers ────────────────────────────────────────────────────────

	async saveSupplier(userId: string, supplierId: string) {
		if (userId === supplierId) {
			throw new HttpBadRequestError(ErrorCode.CANNOT_SAVE_SELF);
		}

		const supplier = await this.userRepository.findById(supplierId);
		if (!supplier) {
			throw new HttpNotFoundError(ErrorCode.USER_NOT_FOUND);
		}

		const existing = await this.savedSupplierRepository.findOne({
			userId,
			supplierId,
		});
		if (existing) {
			throw new HttpBadRequestError(ErrorCode.SAVED_SUPPLIER_ALREADY_EXISTS);
		}

		return this.savedSupplierRepository.create({ userId, supplierId });
	}

	async unsaveSupplier(userId: string, supplierId: string) {
		const saved = await this.savedSupplierRepository.findOne({
			userId,
			supplierId,
		});
		if (!saved) {
			throw new HttpNotFoundError(ErrorCode.SAVED_SUPPLIER_NOT_FOUND);
		}

		await this.savedSupplierRepository.delete(saved.id);
		return null;
	}

	async listSavedSuppliers(userId: string, query: PaginationDto) {
		const paginated = await this.savedSupplierRepository.findWithPagination(
			query.page,
			query.limit,
			{
				where: { userId },
				relations: [
					'supplier',
					'supplier.profile',
					'supplier.profile.avatarMedia',
				],
				order: { createdAt: 'DESC' },
			},
		);

		return {
			...paginated,
			items: paginated.items.map((s) => ({
				id: s.id,
				createdAt: s.createdAt,
				supplier: {
					id: s.supplier.id,
					username: s.supplier.username,
					displayName: s.supplier.profile?.displayName ?? null,
					avatarUrl: s.supplier.profile?.avatarMedia?.cdnUrl ?? null,
				},
			})),
		};
	}

	// ─── Supplier Reviews ────────────────────────────────────────────────────────

	async createReview(
		reviewerId: string,
		supplierId: string,
		dto: CreateSupplierReviewRequestDto,
	) {
		if (reviewerId === supplierId) {
			throw new HttpBadRequestError(ErrorCode.CANNOT_REPORT_SELF);
		}

		const supplier = await this.userRepository.findById(supplierId);
		if (!supplier) {
			throw new HttpNotFoundError(ErrorCode.USER_NOT_FOUND);
		}

		// Verify completed order exists between reviewer (buyer) and supplier (seller)
		if (dto.orderId) {
			const order = await this.orderRepository.findOne({
				id: dto.orderId,
				buyerId: reviewerId,
				sellerId: supplierId,
				status: OrderStatus.COMPLETED,
			});
			if (!order) {
				throw new HttpBadRequestError(
					ErrorCode.SUPPLIER_REVIEW_NO_COMPLETED_ORDER,
				);
			}
		} else {
			const completedOrder = await this.orderRepository.findOne({
				buyerId: reviewerId,
				sellerId: supplierId,
				status: OrderStatus.COMPLETED,
			});
			if (!completedOrder) {
				throw new HttpBadRequestError(
					ErrorCode.SUPPLIER_REVIEW_NO_COMPLETED_ORDER,
				);
			}
		}

		const existing = await this.supplierReviewRepository.findOne({
			reviewerId,
			supplierId,
		});
		if (existing) {
			throw new HttpBadRequestError(ErrorCode.SUPPLIER_REVIEW_ALREADY_EXISTS);
		}

		return this.supplierReviewRepository.create({
			reviewerId,
			supplierId,
			orderId: dto.orderId ?? null,
			rating: dto.rating,
			reviewBody: dto.reviewBody ?? null,
			photoMediaIds: dto.photoMediaIds ?? [],
			isHidden: false,
		});
	}

	async listReviews(supplierId: string, query: PaginationDto) {
		const supplier = await this.userRepository.findById(supplierId);
		if (!supplier) {
			throw new HttpNotFoundError(ErrorCode.USER_NOT_FOUND);
		}

		const paginated = await this.supplierReviewRepository.findWithPagination(
			query.page,
			query.limit,
			{
				where: { supplierId, isHidden: false },
				relations: [
					'reviewer',
					'reviewer.profile',
					'reviewer.profile.avatarMedia',
				],
				order: { createdAt: 'DESC' },
			},
		);

		const allPhotoIds = paginated.items.flatMap((r) => r.photoMediaIds ?? []);
		const photoMap = await this.resolveMediaMap(allPhotoIds);

		return {
			...paginated,
			items: paginated.items.map((r) => ({
				id: r.id,
				rating: r.rating,
				reviewBody: r.reviewBody,
				photos: (r.photoMediaIds ?? [])
					.map((id) => photoMap.get(id))
					.filter(Boolean),
				createdAt: r.createdAt,
				reviewer: {
					id: r.reviewer.id,
					username: r.reviewer.username,
					displayName: r.reviewer.profile?.displayName ?? null,
					avatarUrl: r.reviewer.profile?.avatarMedia?.cdnUrl ?? null,
				},
			})),
		};
	}

	async getReviewSummary(supplierId: string) {
		const supplier = await this.userRepository.findById(supplierId);
		if (!supplier) {
			throw new HttpNotFoundError(ErrorCode.USER_NOT_FOUND);
		}
		return this.supplierReviewRepository.getAggregated(supplierId);
	}

	private async resolveMediaMap(ids: string[]) {
		if (!ids.length)
			return new Map<
				string,
				{ id: string; cdnUrl: string; mimeType: string }
			>();
		const medias = await this.mediaRepository.findByIds([...new Set(ids)]);
		return new Map(
			medias.map((m) => [
				m.id,
				{ id: m.id, cdnUrl: m.cdnUrl, mimeType: m.mimeType },
			]),
		);
	}
}
