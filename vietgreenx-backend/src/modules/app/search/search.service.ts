import { Injectable } from '@nestjs/common';
import { UserRepository } from '@app/database/typeorm/repositories/user.repository';
import { PostRepository } from '@app/database/typeorm/repositories/post.repository';
import { ProductRepository } from '@app/database/typeorm/repositories/product.repository';
import { BlockService } from '../block/block.service';
import { PostService } from '../post/post.service';
import { GlobalSearchQueryDto } from './dto/requests/global-search-query.request.dto';
import { SearchType } from '@app/common/enums/search-type.enum';
import { UserStatus } from '@app/common/enums/user-status.enum';
import { VisibilityType } from '@app/common/enums/visibility-type.enum';
import { ProductStatus } from '@app/common/enums/product-status.enum';
import { HttpBadRequestError } from '@app/common/errors/bad-request.error';
import { ErrorCode } from '@app/common/errors';

@Injectable()
export class SearchService {
	constructor(
		private readonly userRepository: UserRepository,
		private readonly postRepository: PostRepository,
		private readonly productRepository: ProductRepository,
		private readonly blockService: BlockService,
		private readonly postService: PostService,
	) {}

	async globalSearch(viewerId: string, query: GlobalSearchQueryDto) {
		const term = query.q.trim();
		const limit = query.limit || 10;

		const escapedTerm = this.escapeLikePattern(term);

		const blockedUserIds = await this.blockService.getBlockedUserIds(viewerId);

		if (!query.type) {
			const userQb = this.buildUserSearchQuery(
				escapedTerm,
				viewerId,
				blockedUserIds,
			)
				.orderBy('user.username', 'ASC')
				.addOrderBy('user.id', 'DESC')
				.take(limit + 1);

			const postQb = this.buildPostSearchQuery(escapedTerm, blockedUserIds)
				.orderBy('post.createdAt', 'DESC')
				.addOrderBy('post.id', 'DESC')
				.take(limit + 1);

			const productQb = this.buildProductSearchQuery(
				escapedTerm,
				blockedUserIds,
			)
				.orderBy('product.createdAt', 'DESC')
				.addOrderBy('product.id', 'DESC')
				.take(limit + 1);

			const [users, posts, products] = await Promise.all([
				userQb.getMany(),
				postQb.getMany(),
				productQb.getMany(),
			]);

			const hasNextUsers = users.length > limit;
			const hasNextPosts = posts.length > limit;
			const hasNextProducts = products.length > limit;

			const slicedUsers = hasNextUsers ? users.slice(0, limit) : users;
			const slicedPosts = hasNextPosts ? posts.slice(0, limit) : posts;
			const slicedProducts = hasNextProducts
				? products.slice(0, limit)
				: products;

			const postItems = await Promise.all(
				slicedPosts.map((post) =>
					this.postService.toDetailViewForViewer({ post }, viewerId),
				),
			);

			return {
				users: {
					items: slicedUsers.map((user) => ({
						id: user.id,
						username: user.username,
						displayName: user.profile?.displayName ?? null,
						avatarUrl: user.profile?.avatarMedia?.cdnUrl ?? null,
					})),
					nextCursor: null,
					hasNext: hasNextUsers,
				},
				posts: { items: postItems, nextCursor: null, hasNext: hasNextPosts },
				products: {
					items: slicedProducts,
					nextCursor: null,
					hasNext: hasNextProducts,
				},
			};
		}

		if (query.type === SearchType.USERS) {
			const qb = this.buildUserSearchQuery(
				escapedTerm,
				viewerId,
				blockedUserIds,
			)
				.orderBy('user.createdAt', 'DESC')
				.addOrderBy('user.id', 'DESC');

			const paginated = await this.userRepository.paginateWithCursor(
				qb,
				['createdAt', 'id'],
				query.cursor,
				limit,
			);

			return {
				items: paginated.data.map((user) => ({
					id: user.id,
					username: user.username,
					displayName: user.profile?.displayName ?? null,
					avatarUrl: user.profile?.avatarMedia?.cdnUrl ?? null,
				})),
				nextCursor: paginated.nextCursor ?? null,
				hasNext: paginated.hasNext,
				limit: paginated.limit,
			};
		}

		if (query.type === SearchType.POSTS) {
			const qb = this.buildPostSearchQuery(escapedTerm, blockedUserIds)
				.orderBy('post.createdAt', 'DESC')
				.addOrderBy('post.id', 'DESC');

			const paginated = await this.postRepository.paginateWithCursor(
				qb,
				['createdAt', 'id'],
				query.cursor,
				limit,
			);

			const items = await Promise.all(
				paginated.data.map((post) =>
					this.postService.toDetailViewForViewer({ post }, viewerId),
				),
			);

			return {
				items,
				nextCursor: paginated.nextCursor ?? null,
				hasNext: paginated.hasNext,
				limit: paginated.limit,
			};
		}

		if (query.type === SearchType.PRODUCTS) {
			const qb = this.buildProductSearchQuery(escapedTerm, blockedUserIds)
				.orderBy('product.createdAt', 'DESC')
				.addOrderBy('product.id', 'DESC');

			const paginated = await this.productRepository.paginateWithCursor(
				qb,
				['createdAt', 'id'],
				query.cursor,
				limit,
			);

			return {
				items: paginated.data,
				nextCursor: paginated.nextCursor ?? null,
				hasNext: paginated.hasNext,
				limit: paginated.limit,
			};
		}

		throw new HttpBadRequestError(ErrorCode.UNSUPPORTED_SEARCH_TYPE);
	}

	private escapeLikePattern(val: string): string {
		return val.replace(/[\\%_]/g, '\\$&');
	}

	private buildUserSearchQuery(
		escapedTerm: string,
		viewerId: string,
		blockedUserIds: string[],
	) {
		const qb = this.userRepository
			.createQueryBuilder('user')
			.leftJoinAndSelect('user.profile', 'profile')
			.leftJoinAndSelect('profile.avatarMedia', 'avatarMedia')
			.where('user.status = :status', { status: UserStatus.ACTIVE })
			.andWhere('user.id != :viewerId', { viewerId });

		if (blockedUserIds.length > 0) {
			qb.andWhere('user.id NOT IN (:...blockedUserIds)', { blockedUserIds });
		}

		qb.andWhere(
			"(user.username ILIKE :term ESCAPE '\\' OR profile.displayName ILIKE :term ESCAPE '\\')",
			{
				term: `%${escapedTerm}%`,
			},
		);

		return qb;
	}

	private buildPostSearchQuery(escapedTerm: string, blockedUserIds: string[]) {
		const qb = this.postRepository
			.createQueryBuilder('post')
			.leftJoinAndSelect('post.author', 'author')
			.leftJoinAndSelect('author.profile', 'profile')
			.leftJoinAndSelect('profile.avatarMedia', 'avatarMedia')
			.leftJoinAndSelect('post.postMedia', 'postMedia')
			.leftJoinAndSelect('postMedia.media', 'media')
			.leftJoinAndSelect('post.postHashtags', 'postHashtags')
			.leftJoinAndSelect('postHashtags.hashtag', 'hashtag')
			.leftJoinAndSelect('post.postTags', 'postTags')
			.where('post.isDraft = :isDraft', { isDraft: false })
			.andWhere('post.visibility = :visibility', {
				visibility: VisibilityType.PUBLIC,
			});

		if (blockedUserIds.length > 0) {
			qb.andWhere('post.authorId NOT IN (:...blockedUserIds)', {
				blockedUserIds,
			});
		}

		qb.andWhere(
			"(post.body ILIKE :term ESCAPE '\\' OR hashtag.tag ILIKE :term ESCAPE '\\')",
			{
				term: `%${escapedTerm}%`,
			},
		);

		return qb;
	}

	private buildProductSearchQuery(
		escapedTerm: string,
		blockedUserIds: string[],
	) {
		const qb = this.productRepository
			.createQueryBuilder('product')
			.leftJoinAndSelect('product.category', 'category')
			.where('product.status = :pStatus', { pStatus: ProductStatus.ACTIVE });

		if (blockedUserIds.length > 0) {
			qb.andWhere(
				'(product.ownerUserId IS NULL OR product.ownerUserId NOT IN (:...blockedUserIds))',
				{ blockedUserIds },
			);
		}

		qb.andWhere(
			"(product.name ILIKE :term ESCAPE '\\' OR product.description ILIKE :term ESCAPE '\\')",
			{
				term: `%${escapedTerm}%`,
			},
		);

		return qb;
	}
}
