import { Injectable } from '@nestjs/common';
import { In } from 'typeorm';
import { ProductCertification } from '@app/database/typeorm/entities/agriculture/product-certification.entity';
import { CertificationRepository } from '@app/database/typeorm/repositories/certification.repository';
import { ProductCertificationRepository } from '@app/database/typeorm/repositories/product-certification.repository';
import { CertificationStatus } from '@app/common/enums/certification-status.enum';
import { ProductStatus } from '@app/common/enums/product-status.enum';
import { ProductRepository } from '@app/database/typeorm/repositories/product.repository';
import { Product } from '@app/database/typeorm/entities/agriculture/product.entity';
import { CreateProductRequestDto } from './dto/requests/create-product.request.dto';
import { UpdateProductRequestDto } from './dto/requests/update-product.request.dto';
import { User } from '@app/database/typeorm/entities/identity/user.entity';
import { CategoryRepository } from '@app/database/typeorm/repositories/category.repository';
import { MediaRepository } from '@app/database/typeorm/repositories/media.repository';
import { MediaUploadService } from '../media/media-upload.service';
import { GreenProfileRepository } from '@app/database/typeorm/repositories/green-profile.repository';
import { HttpBadRequestError } from '@app/common/errors/bad-request.error';
import { HttpNotFoundError } from '@app/common/errors/not-found.error';
import { HttpForbiddenError } from '@app/common/errors/forbidden.error';
import { ErrorCode } from '@app/common/errors/error-code';
import { slugify } from '@app/utils/slugify';
import { PaginationDto } from '@app/common/dtos/paginationDto';

@Injectable()
export class ProductService {
	constructor(
		private readonly productRepository: ProductRepository,
		private readonly categoryRepository: CategoryRepository,
		private readonly mediaRepository: MediaRepository,
		private readonly mediaUploadService: MediaUploadService,
		private readonly greenProfileRepository: GreenProfileRepository,
		private readonly certificationRepository: CertificationRepository,
		private readonly productCertificationRepository: ProductCertificationRepository,
	) {}

	async createProduct(user: User, dto: CreateProductRequestDto) {
		const greenProfile = await this.greenProfileRepository.findOne({
			userId: user.id,
		});

		if (!greenProfile) {
			throw new HttpNotFoundError(ErrorCode.GREEN_PROFILE_NOT_FOUND);
		}

		const existingProduct = await this.productRepository.findOne({
			name: dto.name,
			categoryId: dto.categoryId,
			ownerUserId: user.id,
		});

		if (existingProduct) {
			throw new HttpBadRequestError(ErrorCode.PRODUCT_ALREADY_EXISTS);
		}

		const categoryExists = await this.categoryRepository.exists({
			id: dto.categoryId,
		});
		if (!categoryExists) {
			throw new HttpNotFoundError(ErrorCode.CATEGORY_NOT_FOUND);
		}

		if (dto.photoMediaIds !== undefined) {
			dto.photoMediaIds = await this.validatePhotoMediaIds(
				user.id,
				dto.photoMediaIds,
			);
		}
		let validatedCertificationIds: string[] = [];
		if (dto.certificationIds && dto.certificationIds.length > 0) {
			validatedCertificationIds = await this.validateCertificationIds(
				greenProfile.id,
				dto.certificationIds,
			);
		}

		//create utils slug genera slug
		const baseSlug = slugify(dto.name);
		let slug = baseSlug;
		let slugExists = await this.productRepository.exists({ slug });
		let counter = 1;
		while (slugExists) {
			slug = `${baseSlug}-${counter}`;
			slugExists = await this.productRepository.exists({ slug });
			counter++;
		}

		const savedProduct = await this.productRepository.executeInTransaction(
			async (manager) => {
				const { certificationIds: _certificationIds, ...productPayload } = dto;
				const productEntity = manager.create(Product, {
					...productPayload,
					ownerUserId: user.id,
					greenProfileId: greenProfile.id,
					slug,
				});

				const saved = await manager.save(productEntity);

				if (validatedCertificationIds.length > 0) {
					const productCerts = validatedCertificationIds.map((certId) =>
						manager.create(ProductCertification, {
							productId: saved.id,
							certificationId: certId,
						}),
					);
					await manager.save(ProductCertification, productCerts);
				}

				return saved;
			},
		);

		return this.loadProductDetail(savedProduct.id, user.id);
	}
	async getAllProducts(user: User, query: PaginationDto) {
		const result = await this.productRepository.findWithPagination(
			query.page,
			query.limit,
			{
				where: { ownerUserId: user.id },
				order: { createdAt: 'DESC' },
			},
		);

		const productIds = result.items.map((p) => p.id);
		let allCerts: ProductCertification[] = [];
		if (productIds.length > 0) {
			allCerts = await this.productCertificationRepository.findAll({
				where: { productId: In(productIds) },
			});
		}

		const certMap = new Map<string, ProductCertification[]>();
		for (const cert of allCerts) {
			const list = certMap.get(cert.productId) || [];
			list.push(cert);
			certMap.set(cert.productId, list);
		}

		const allPhotoIds = result.items.flatMap((p) => p.photoMediaIds ?? []);
		const allPhotoMedias = allPhotoIds.length
			? await this.mediaRepository.findByIdsPreserveOrder(allPhotoIds)
			: [];
		const photoMap = new Map(allPhotoMedias.map((m) => [m.id, m]));

		const items = result.items.map((product) => {
			const productCertifications = certMap.get(product.id) || [];
			const photoMedias = (product.photoMediaIds ?? [])
				.map((id) => photoMap.get(id))
				.filter((m): m is NonNullable<typeof m> => m !== undefined);
			return this.toDetailView({ product, productCertifications, photoMedias });
		});

		return { ...result, items };
	}

	async getProductDetail(user: User, productId: string) {
		return this.loadProductDetail(productId, user.id);
	}

	async updateProduct(
		user: User,
		productId: string,
		dto: UpdateProductRequestDto,
	) {
		const product = await this.productRepository.findOne({ id: productId });

		if (!product) {
			throw new HttpNotFoundError(ErrorCode.PRODUCT_NOT_FOUND);
		}

		if (product.ownerUserId !== user.id) {
			throw new HttpForbiddenError(ErrorCode.PRODUCT_FORBIDDEN);
		}

		if (dto.categoryId && dto.categoryId !== product.categoryId) {
			const categoryExists = await this.categoryRepository.exists({
				id: dto.categoryId,
			});
			if (!categoryExists) {
				throw new HttpNotFoundError(ErrorCode.CATEGORY_NOT_FOUND);
			}
		}

		if (dto.name && dto.name !== product.name) {
			const existingProduct = await this.productRepository.findOne({
				name: dto.name,
				categoryId: dto.categoryId || product.categoryId,
				ownerUserId: user.id,
			});
			if (existingProduct) {
				throw new HttpBadRequestError(ErrorCode.PRODUCT_ALREADY_EXISTS);
			}
		}

		if (dto.photoMediaIds !== undefined) {
			dto.photoMediaIds = await this.validatePhotoMediaIds(
				user.id,
				dto.photoMediaIds,
			);
		}

		let validatedCertificationIds: string[] | undefined;
		if (dto.certificationIds !== undefined) {
			const greenProfile = await this.greenProfileRepository.findOne({
				userId: user.id,
			});
			if (!greenProfile) {
				throw new HttpNotFoundError(ErrorCode.GREEN_PROFILE_NOT_FOUND);
			}
			validatedCertificationIds = await this.validateCertificationIds(
				greenProfile.id,
				dto.certificationIds,
			);
		}

		await this.productRepository.executeInTransaction(async (manager) => {
			if (validatedCertificationIds !== undefined) {
				await manager.delete(ProductCertification, { productId: product.id });
				if (validatedCertificationIds.length > 0) {
					const productCerts = validatedCertificationIds.map((certId) =>
						manager.create(ProductCertification, {
							productId: product.id,
							certificationId: certId,
						}),
					);
					await manager.save(ProductCertification, productCerts);
				}
			}

			const { certificationIds: _certificationIds, ...updatePayload } = dto;
			if (Object.keys(updatePayload).length > 0) {
				await manager.update(Product, product.id, updatePayload);
			}
		});

		return this.loadProductDetail(product.id, user.id);
	}

	private async validateCertificationIds(
		greenProfileId: string,
		certificationIds: string[],
	): Promise<string[]> {
		if (!certificationIds || certificationIds.length === 0) return [];

		const uniqueIds = [...new Set(certificationIds)];

		const certifications = await this.certificationRepository.findAll({
			where: {
				id: In(uniqueIds),
				greenProfileId,
			},
		});

		if (certifications.length !== uniqueIds.length) {
			throw new HttpBadRequestError(ErrorCode.CERTIFICATION_NOT_FOUND);
		}

		for (const cert of certifications) {
			if (
				cert.status === CertificationStatus.EXPIRED ||
				cert.status === CertificationStatus.REVOKED
			) {
				throw new HttpBadRequestError(
					ErrorCode.CERTIFICATION_EXPIRED_OR_REVOKED,
				);
			}
		}

		return uniqueIds;
	}

	private async validatePhotoMediaIds(
		userId: string,
		mediaIds: string[],
	): Promise<string[]> {
		if (!mediaIds || mediaIds.length === 0) return [];

		if (mediaIds.length > 9) {
			throw new HttpBadRequestError(ErrorCode.POST_MEDIA_LIMIT_EXCEEDED);
		}

		const uniqueIds = [...new Set(mediaIds)];
		if (uniqueIds.length !== mediaIds.length) {
			throw new HttpBadRequestError(ErrorCode.MEDIA_NOT_FOUND);
		}

		const mediaList = await this.mediaRepository.findByIds(uniqueIds);
		if (mediaList.length !== uniqueIds.length) {
			throw new HttpBadRequestError(ErrorCode.MEDIA_NOT_FOUND);
		}

		for (const media of mediaList) {
			this.mediaUploadService.assertMediaReadyForProduct(media, userId);
		}

		return uniqueIds;
	}

	private async loadProductDetail(productId: string, viewerId?: string) {
		const product = await this.productRepository.findOne({ id: productId });
		if (!product) {
			throw new HttpNotFoundError(ErrorCode.PRODUCT_NOT_FOUND);
		}

		if (viewerId && product.ownerUserId !== viewerId) {
			if (
				product.status === ProductStatus.DRAFT ||
				product.status === ProductStatus.ARCHIVED
			) {
				throw new HttpNotFoundError(ErrorCode.PRODUCT_NOT_FOUND);
			}
		}

		const [productCerts, photoMedias] = await Promise.all([
			this.productCertificationRepository.findAll({ where: { productId } }),
			product.photoMediaIds?.length
				? this.mediaRepository.findByIdsPreserveOrder(product.photoMediaIds)
				: Promise.resolve([]),
		]);

		return this.toDetailView({
			product,
			productCertifications: productCerts,
			photoMedias,
		});
	}

	toDetailView(input: {
		product: Product;
		productCertifications?: ProductCertification[];
		photoMedias?: { id: string; cdnUrl: string; mimeType: string }[];
	}) {
		const { product, productCertifications = [], photoMedias = [] } = input;

		return {
			...product,
			certificationIds: productCertifications.map((pc) => pc.certificationId),
			photoMedias: photoMedias.map((m) => ({
				id: m.id,
				cdnUrl: m.cdnUrl,
				mimeType: m.mimeType,
			})),
		};
	}
}
