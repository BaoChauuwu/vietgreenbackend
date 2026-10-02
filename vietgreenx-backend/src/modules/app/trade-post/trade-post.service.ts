import { Injectable } from '@nestjs/common';
import { TradePostRepository } from '@app/database/typeorm/repositories/trade-post.repository';
import { CategoryRepository } from '@app/database/typeorm/repositories/category.repository';
import { MediaRepository } from '@app/database/typeorm/repositories/media.repository';
import { User } from '@app/database/typeorm/entities/identity/user.entity';
import { TradePost } from '@app/database/typeorm/entities/agriculture/trade-post.entity';
import { Category } from '@app/database/typeorm/entities/agriculture/category.entity';
import { TradeType } from '@app/common/enums/trade-type.enum';
import { TradeStatus } from '@app/common/enums/trade-status.enum';
import { UserRole } from '@app/common/enums/user-role.enum';
import { HttpNotFoundError } from '@app/common/errors/not-found.error';
import { HttpForbiddenError } from '@app/common/errors/forbidden.error';
import { HttpBadRequestError } from '@app/common/errors/bad-request.error';
import { ErrorCode } from '@app/common/errors/error-code';
import { CreateSellOfferRequestDto } from './dto/requests/create-sell-offer.request.dto';
import { CreateBuyRequestDto } from './dto/requests/create-buy-request.request.dto';
import { UpdateTradePostDto } from './dto/requests/update-trade-post.request.dto';
import { TradePostQueryDto } from './dto/requests/trade-post-query.request.dto';

@Injectable()
export class TradePostService {
	constructor(
		private readonly tradePostRepository: TradePostRepository,
		private readonly categoryRepository: CategoryRepository,
		private readonly mediaRepository: MediaRepository,
	) {}

	async createSellOffer(user: User, dto: CreateSellOfferRequestDto) {
		if (
			user.role !== UserRole.SELLER &&
			user.role !== UserRole.COOPERATIVE &&
			user.role !== UserRole.ENTERPRISE
		) {
			throw new HttpForbiddenError(ErrorCode.TRADE_POST_ROLE_FORBIDDEN);
		}

		const categoryExists = await this.categoryRepository.exists({
			id: dto.categoryId,
		});
		if (!categoryExists) {
			throw new HttpNotFoundError(ErrorCode.CATEGORY_NOT_FOUND);
		}

		const listingDays = dto.listingDays ?? 14;
		const expiresAt = new Date();
		expiresAt.setDate(expiresAt.getDate() + listingDays);

		const post = await this.tradePostRepository.create({
			posterUserId: user.id,
			tradeType: TradeType.SELL,
			categoryId: dto.categoryId,
			productId: dto.productId ?? null,
			title: dto.title,
			quantity: dto.quantity,
			quantityUnit: dto.quantityUnit,
			priceReference: dto.priceReference ?? null,
			province: dto.province ?? null,
			provinceCode: dto.provinceCode ?? null,
			districtCode: dto.districtCode ?? null,
			wardCode: dto.wardCode ?? null,
			description: dto.description ?? null,
			photoMediaIds: dto.photoMediaIds ?? [],
			certRequirements: [],
			listingDays,
			expiresAt,
			status: TradeStatus.ACTIVE,
		});

		return this.findOne(post.id);
	}

	async createBuyRequest(user: User, dto: CreateBuyRequestDto) {
		if (
			user.role !== UserRole.ENTERPRISE &&
			user.role !== UserRole.COOPERATIVE
		) {
			throw new HttpForbiddenError(ErrorCode.TRADE_POST_ROLE_FORBIDDEN);
		}

		const categoryExists = await this.categoryRepository.exists({
			id: dto.categoryId,
		});
		if (!categoryExists) {
			throw new HttpNotFoundError(ErrorCode.CATEGORY_NOT_FOUND);
		}

		const listingDays = 30;
		let expiresAt: Date;
		if (dto.deadline) {
			expiresAt = new Date(dto.deadline);
		} else {
			expiresAt = new Date();
			expiresAt.setDate(expiresAt.getDate() + listingDays);
		}

		const post = await this.tradePostRepository.create({
			posterUserId: user.id,
			tradeType: TradeType.BUY,
			categoryId: dto.categoryId,
			title: dto.title,
			quantity: dto.quantity,
			quantityUnit: dto.quantityUnit,
			priceReference: dto.priceReference ?? null,
			province: dto.province ?? null,
			provinceCode: dto.provinceCode ?? null,
			districtCode: dto.districtCode ?? null,
			wardCode: dto.wardCode ?? null,
			description: dto.description ?? null,
			photoMediaIds: [],
			certRequirements: dto.certRequirements ?? [],
			deadline: dto.deadline ?? null,
			listingDays,
			expiresAt,
			status: TradeStatus.ACTIVE,
		});

		return this.findOne(post.id);
	}

	async findAll(query: TradePostQueryDto) {
		const {
			tradeType,
			province,
			categoryId,
			minQuantity,
			maxQuantity,
			sort,
			page,
			limit,
		} = query;
		const result = await this.tradePostRepository.findWithFilters({
			tradeType,
			province,
			categoryId,
			minQuantity,
			maxQuantity,
			sort,
			page,
			limit,
		});
		const allIds = result.data.flatMap((p) => p.photoMediaIds ?? []);
		const mediaMap = await this.resolveMediaMap(allIds);
		return {
			items: result.data.map((p) => this.toView(p, mediaMap)),
			total: result.total,
			page: query.page,
			limit: query.limit,
			totalPage: Math.ceil(result.total / query.limit),
		};
	}

	async findOne(id: string) {
		const post = await this.tradePostRepository.findOne({ id }, [
			'posterUser',
			'posterUser.profile',
			'category',
		]);
		if (!post) {
			throw new HttpNotFoundError(ErrorCode.TRADE_POST_NOT_FOUND);
		}
		const mediaMap = await this.resolveMediaMap(post.photoMediaIds ?? []);
		return this.toView(post, mediaMap);
	}

	async update(user: User, id: string, dto: UpdateTradePostDto) {
		const post = await this.tradePostRepository.findOne({ id });
		if (!post) {
			throw new HttpNotFoundError(ErrorCode.TRADE_POST_NOT_FOUND);
		}
		if (post.posterUserId !== user.id) {
			throw new HttpForbiddenError(ErrorCode.TRADE_POST_FORBIDDEN);
		}
		if (
			post.status === TradeStatus.CLOSED ||
			post.status === TradeStatus.EXPIRED
		) {
			throw new HttpBadRequestError(ErrorCode.TRADE_POST_CANNOT_MODIFY);
		}

		await this.tradePostRepository.update(id, dto as Partial<TradePost>);
		return this.findOne(id);
	}

	async close(user: User, id: string) {
		const post = await this.tradePostRepository.findOne({ id });
		if (!post) {
			throw new HttpNotFoundError(ErrorCode.TRADE_POST_NOT_FOUND);
		}
		if (post.posterUserId !== user.id) {
			throw new HttpForbiddenError(ErrorCode.TRADE_POST_FORBIDDEN);
		}

		await this.tradePostRepository.update(id, {
			status: TradeStatus.CLOSED,
		} as Partial<TradePost>);
		return this.findOne(id);
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

	private toView(
		post: TradePost,
		mediaMap: Map<
			string,
			{ id: string; cdnUrl: string; mimeType: string }
		> = new Map(),
	) {
		const poster = post.posterUser
			? {
					id: post.posterUser.id,
					username: post.posterUser.username,
					displayName: post.posterUser.profile?.displayName ?? null,
					avatarUrl: null as string | null,
				}
			: null;

		const cat = post.category as Category | null;
		const category = cat
			? {
					id: cat.id,
					nameEn: cat.nameEn,
					nameVi: cat.nameVi,
					slug: cat.slug,
				}
			: null;

		return {
			id: post.id,
			tradeType: post.tradeType,
			status: post.status,
			title: post.title,
			quantity: post.quantity,
			quantityUnit: post.quantityUnit,
			priceReference: post.priceReference,
			province: post.province,
			provinceCode: post.provinceCode,
			districtCode: post.districtCode,
			wardCode: post.wardCode,
			description: post.description,
			photoMedias: (post.photoMediaIds ?? [])
				.map((id) => mediaMap.get(id))
				.filter(Boolean),
			certRequirements: post.certRequirements,
			deadline: post.deadline,
			listingDays: post.listingDays,
			expiresAt: post.expiresAt,
			interestedCount: post.interestedCount,
			viewCount: post.viewCount,
			createdAt: post.createdAt,
			poster,
			category,
		};
	}
}
