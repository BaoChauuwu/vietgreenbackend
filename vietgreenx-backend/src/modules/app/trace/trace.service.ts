import { Injectable } from '@nestjs/common';
import { HashService } from '../hash/hash.service';
import { PublicTraceTokenRepository } from '@app/database/typeorm/repositories/public-trace-token.repository';
import { QrScanRepository } from '@app/database/typeorm/repositories/qr-scan.repository';
import { ProductCertificationRepository } from '@app/database/typeorm/repositories/product-certification.repository';
import { CropSeasonRepository } from '@app/database/typeorm/repositories/crop-season.repository';
import { ProductReviewRepository } from '@app/database/typeorm/repositories/product-review.repository';
import { MediaRepository } from '@app/database/typeorm/repositories/media.repository';
import {
	ProductionLogService,
	QrMilestoneSummary,
} from '../production-log/production-log.service';
import { HttpNotFoundError, HttpBadRequestError } from '@app/common/errors';
import { ErrorCode } from '@app/common/errors/error-code';
import { CertificationStatus } from '@app/common/enums/certification-status.enum';
import { CertificationValidityStatus } from '@app/common/enums/certification-validity-status.enum';
import { CreateReviewRequestDto } from './dto/requests/create-review.request.dto';
import { PaginationDto } from '@app/common/dtos/paginationDto';

@Injectable()
export class TraceService {
	constructor(
		private readonly publicTraceTokenRepo: PublicTraceTokenRepository,
		private readonly qrScanRepo: QrScanRepository,
		private readonly productCertificationRepo: ProductCertificationRepository,
		private readonly cropSeasonRepo: CropSeasonRepository,
		private readonly productReviewRepo: ProductReviewRepository,
		private readonly productionLogService: ProductionLogService,
		private readonly mediaRepository: MediaRepository,
		private readonly hashService: HashService,
	) {}

	private async findTraceToken(token: string, relations: string[] = []) {
		let traceToken = await this.publicTraceTokenRepo.findOne(
			{ token },
			relations,
		);
		if (!traceToken) {
			traceToken = await this.publicTraceTokenRepo.findOne(
				{ id: token },
				relations,
			);
		}
		return traceToken;
	}

	async getTraceDetails(
		token: string,
		ip: string,
		userAgent?: string,
		referrer?: string,
	) {
		const traceToken = await this.findTraceToken(token, [
			'product',
			'batch',
			'product.category',
			'product.greenProfile',
			'batch.product',
			'batch.product.category',
			'batch.greenProfile',
			'batch.product.greenProfile',
		]);

		if (!traceToken || !traceToken.isActive) {
			throw new HttpNotFoundError(ErrorCode.TRACE_TOKEN_NOT_FOUND);
		}

		await this.qrScanRepo.create({
			tokenId: traceToken.id,
			ipAddress: ip,
			userAgent: userAgent || null,
			referrer: referrer || null,
		});

		const isBatch = traceToken.targetType === 'batch';
		const product = isBatch ? traceToken.batch?.product : traceToken.product;
		const batch = isBatch ? traceToken.batch : null;

		if (!product) {
			throw new HttpNotFoundError(ErrorCode.PRODUCT_NOT_FOUND);
		}

		const greenProfile = isBatch
			? traceToken.batch?.greenProfile ||
				traceToken.batch?.product?.greenProfile
			: traceToken.product?.greenProfile;
		const producerSlug = greenProfile?.slug || null;

		const allMediaIds = [
			...(product.photoMediaIds ?? []),
			...(greenProfile?.photoMediaIds ?? []),
		];
		const allMediaIds_unique = [...new Set(allMediaIds)];
		const mediaMap = allMediaIds_unique.length
			? new Map(
					(await this.mediaRepository.findByIds(allMediaIds_unique)).map(
						(m) => [m.id, { id: m.id, cdnUrl: m.cdnUrl, mimeType: m.mimeType }],
					),
				)
			: new Map<string, { id: string; cdnUrl: string; mimeType: string }>();

		const farmPhotos = (greenProfile?.photoMediaIds ?? [])
			.map((id) => mediaMap.get(id))
			.filter(Boolean);
		const productPhotos = (product.photoMediaIds ?? [])
			.map((id) => mediaMap.get(id))
			.filter(Boolean);

		const productCerts = await this.productCertificationRepo.findAll({
			where: { productId: product.id },
			relations: ['certification'],
		});

		const certifications = productCerts.map((productCert) => {
			const cert = productCert.certification;
			let validityStatus = CertificationValidityStatus.VALID;

			if (cert.status === CertificationStatus.REVOKED) {
				validityStatus = CertificationValidityStatus.REVOKED;
			} else {
				const currentDate = new Date();
				currentDate.setHours(0, 0, 0, 0);
				const expiryDate = new Date(cert.expiryDate);
				expiryDate.setHours(0, 0, 0, 0);

				if (
					cert.status === CertificationStatus.EXPIRED ||
					currentDate > expiryDate
				) {
					validityStatus = CertificationValidityStatus.EXPIRED;
				}
			}

			return {
				certType: cert.certType,
				certNumber: cert.certNumber,
				issuingAuthority: cert.issuingAuthority,
				issueDate: cert.issueDate,
				expiryDate: cert.expiryDate,
				documentUrl: cert.documentUrl,
				validityStatus,
			};
		});

		let seasonId: string | null = null;
		if (isBatch && batch) {
			seasonId = batch.cropSeasonId;
		} else {
			const latestSeason = await this.cropSeasonRepo.findOneByOptions({
				where: { productId: product.id },
				order: { createdAt: 'DESC' },
			});
			if (latestSeason) {
				seasonId = latestSeason.id;
			}
		}

		let milestones: QrMilestoneSummary[] = [];
		if (seasonId) {
			milestones = await this.productionLogService.getQrSummary(seasonId);
		}

		const reviews = await this.getReviewSummary(traceToken.id);

		const entityType = isBatch ? 'batch' : 'product';
		const entityId = isBatch ? (batch?.id ?? product.id) : product.id;
		const verificationStatus = await this.hashService.getVerificationStatus(
			entityType,
			entityId,
		);

		return {
			token: traceToken.token,
			targetType: traceToken.targetType,
			producerSlug,
			farmPhotos,
			product: { ...product, photoMedias: productPhotos },
			batch,
			milestones,
			certifications,
			reviews,
			verificationStatus,
		};
	}

	async createReview(
		token: string,
		reviewerId: string,
		dto: CreateReviewRequestDto,
	) {
		const traceToken = await this.findTraceToken(token);
		if (!traceToken || !traceToken.isActive) {
			throw new HttpNotFoundError(ErrorCode.TRACE_TOKEN_NOT_FOUND);
		}

		const existing = await this.productReviewRepo.findOne({
			tokenId: traceToken.id,
			reviewerId,
		});
		if (existing) {
			throw new HttpBadRequestError(ErrorCode.PRODUCT_REVIEW_ALREADY_EXISTS);
		}

		return this.productReviewRepo.create({
			tokenId: traceToken.id,
			reviewerId,
			rating: dto.rating,
			reviewBody: dto.reviewBody ?? null,
			photoMediaIds: dto.photoMediaIds ?? [],
			isHidden: false,
		});
	}

	async getReviews(token: string, query: PaginationDto) {
		const traceToken = await this.findTraceToken(token);
		if (!traceToken || !traceToken.isActive) {
			throw new HttpNotFoundError(ErrorCode.TRACE_TOKEN_NOT_FOUND);
		}

		const paginated = await this.productReviewRepo.findWithPagination(
			query.page,
			query.limit,
			{
				where: { tokenId: traceToken.id, isHidden: false },
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
					displayName: r.reviewer?.profile?.displayName ?? null,
					avatarUrl: r.reviewer?.profile?.avatarMedia?.cdnUrl ?? null,
				},
			})),
		};
	}

	private async getReviewSummary(tokenId: string) {
		const reviews = await this.productReviewRepo.findAll({
			where: { tokenId, isHidden: false },
			relations: [
				'reviewer',
				'reviewer.profile',
				'reviewer.profile.avatarMedia',
			],
			order: { createdAt: 'DESC' },
			take: 5,
		});

		const allRatings = await this.productReviewRepo.findAll({
			where: { tokenId, isHidden: false },
			select: ['rating'],
		});

		const reviewCount = allRatings.length;
		const avgRating =
			reviewCount > 0
				? Math.round(
						(allRatings.reduce((sum, r) => sum + r.rating, 0) / reviewCount) *
							10,
					) / 10
				: 0;

		const allPhotoIds = reviews.flatMap((r) => r.photoMediaIds ?? []);
		const photoMap = await this.resolveMediaMap(allPhotoIds);

		const items = reviews.map((r) => ({
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
		}));

		return { avgRating, reviewCount, items };
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
