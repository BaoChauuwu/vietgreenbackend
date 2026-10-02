import { Injectable } from '@nestjs/common';
import { ProductReviewRepository } from '@app/database/typeorm/repositories/product-review.repository';
import { PublicTraceTokenRepository } from '@app/database/typeorm/repositories/public-trace-token.repository';
import { ProductRepository } from '@app/database/typeorm/repositories/product.repository';
import { OrganizationMemberRepository } from '@app/database/typeorm/repositories/organization-member.repository';
import { OrgMemberStatus } from '@app/common/enums/org-member-status.enum';
import { CreateProductReviewRequestDto } from './dto/requests/create-product-review.request.dto';
import { User, ProductReview } from '@app/database/typeorm/entities';
import { HttpNotFoundError } from '@app/common/errors/not-found.error';
import { HttpBadRequestError } from '@app/common/errors/bad-request.error';
import { HttpForbiddenError } from '@app/common/errors/forbidden.error';
import { ErrorCode } from '@app/common/errors/error-code';
import { PaginationDto } from '@app/common/dtos/paginationDto';
import { Pagination } from '@app/common/types/request-response.type';

@Injectable()
export class ProductReviewService {
	constructor(
		private readonly productReviewRepo: ProductReviewRepository,
		private readonly publicTraceTokenRepo: PublicTraceTokenRepository,
		private readonly productRepository: ProductRepository,
		private readonly organizationMemberRepo: OrganizationMemberRepository,
	) {}

	async createReview(
		token: string,
		user: User,
		dto: CreateProductReviewRequestDto,
	): Promise<ProductReview> {
		const traceToken = await this.publicTraceTokenRepo.findOne({ token }, [
			'product',
			'batch',
			'batch.product',
		]);

		if (!traceToken || !traceToken.isActive) {
			throw new HttpNotFoundError(ErrorCode.TRACE_TOKEN_NOT_FOUND);
		}

		let productOwnerId: string | null = null;
		let organizationId: string | null = null;
		if (traceToken.product) {
			productOwnerId = traceToken.product.ownerUserId;
			organizationId = traceToken.product.organizationId;
		} else if (traceToken.batch && traceToken.batch.product) {
			productOwnerId = traceToken.batch.product.ownerUserId;
			organizationId = traceToken.batch.product.organizationId;
		}

		if (productOwnerId === user.id) {
			throw new HttpForbiddenError(ErrorCode.CANNOT_REVIEW_OWN_PRODUCT);
		}

		if (organizationId) {
			const isMember = await this.organizationMemberRepo.exists({
				organizationId,
				userId: user.id,
				status: OrgMemberStatus.ACTIVE,
			});
			if (isMember) {
				throw new HttpForbiddenError(ErrorCode.CANNOT_REVIEW_OWN_PRODUCT);
			}
		}

		const existingReview = await this.productReviewRepo.findOne({
			tokenId: traceToken.id,
			reviewerId: user.id,
		});

		if (existingReview) {
			throw new HttpBadRequestError(ErrorCode.PRODUCT_REVIEW_ALREADY_EXISTS);
		}

		try {
			const createdReview = await this.productReviewRepo.create({
				tokenId: traceToken.id,
				reviewerId: user.id,
				rating: dto.rating,
				reviewBody: dto.reviewBody || null,
			});

			const review = await this.productReviewRepo.findOne(
				{ id: createdReview.id },
				['reviewer', 'reviewer.profile', 'reviewer.profile.avatarMedia'],
			);

			return review!;
		} catch (error: any) {
			if (error?.code === '23505' || error?.code === 'ER_DUP_ENTRY') {
				throw new HttpBadRequestError(ErrorCode.PRODUCT_REVIEW_ALREADY_EXISTS);
			}
			throw error;
		}
	}

	async getProductReviews(
		productId: string,
		query: PaginationDto,
	): Promise<Pagination<ProductReview>> {
		const product = await this.productRepository.findOne({ id: productId });
		if (!product) {
			throw new HttpNotFoundError(ErrorCode.PRODUCT_NOT_FOUND);
		}

		return this.productReviewRepo.findWithPagination(query.page, query.limit, {
			where: [
				{ token: { productId }, isHidden: false },
				{ token: { batch: { productId } }, isHidden: false },
			],
			relations: [
				'reviewer',
				'reviewer.profile',
				'reviewer.profile.avatarMedia',
			],
			order: { createdAt: 'DESC' },
		});
	}
}
