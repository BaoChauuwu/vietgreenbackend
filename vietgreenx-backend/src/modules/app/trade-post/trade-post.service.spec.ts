import { Test, TestingModule } from '@nestjs/testing';
import { TradePostService } from './trade-post.service';
import { TradePostRepository } from '@app/database/typeorm/repositories/trade-post.repository';
import { CategoryRepository } from '@app/database/typeorm/repositories/category.repository';
import { UserRole } from '@app/common/enums/user-role.enum';
import { TradeType } from '@app/common/enums/trade-type.enum';
import { TradeStatus } from '@app/common/enums/trade-status.enum';
import { HttpForbiddenError } from '@app/common/errors/forbidden.error';
import { HttpNotFoundError } from '@app/common/errors/not-found.error';
import { HttpBadRequestError } from '@app/common/errors/bad-request.error';

const createMockTradePostRepository = () => ({
	create: jest.fn(),
	findOne: jest.fn(),
	findWithFilters: jest.fn(),
	update: jest.fn(),
});

const createMockCategoryRepository = () => ({
	exists: jest.fn(),
});

const buildUser = (role: UserRole, id = 'user-1') =>
	({ id, role, username: 'testuser', profile: null }) as any;

const buildPost = (overrides: Record<string, any> = {}) =>
	({
		id: 'post-1',
		tradeType: TradeType.SELL,
		status: TradeStatus.ACTIVE,
		title: 'Test post',
		quantity: 10,
		quantityUnit: 'kg',
		priceReference: null,
		province: null,
		description: null,
		photoMediaIds: [],
		certRequirements: [],
		deadline: null,
		listingDays: 14,
		expiresAt: new Date(),
		interestedCount: 0,
		viewCount: 0,
		createdAt: new Date(),
		posterUserId: 'user-1',
		posterUser: null,
		category: null,
		...overrides,
	}) as any;

describe('TradePostService', () => {
	let service: TradePostService;
	let tradePostRepository: ReturnType<typeof createMockTradePostRepository>;
	let categoryRepository: ReturnType<typeof createMockCategoryRepository>;

	beforeEach(async () => {
		tradePostRepository = createMockTradePostRepository();
		categoryRepository = createMockCategoryRepository();

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				TradePostService,
				{ provide: TradePostRepository, useValue: tradePostRepository },
				{ provide: CategoryRepository, useValue: categoryRepository },
			],
		}).compile();

		service = module.get<TradePostService>(TradePostService);
	});

	afterEach(() => jest.clearAllMocks());

	// ─── createSellOffer ──────────────────────────────────────────────────────

	describe('createSellOffer', () => {
		const dto = {
			categoryId: 'cat-1',
			title: 'Fresh tomatoes',
			quantity: 50,
			quantityUnit: 'kg',
		} as any;

		it('throws ROLE_FORBIDDEN when user is CONSUMER', async () => {
			const user = buildUser(UserRole.CONSUMER);

			await expect(service.createSellOffer(user, dto)).rejects.toThrow(
				HttpForbiddenError,
			);
		});

		it('throws ROLE_FORBIDDEN when user is EXPERT', async () => {
			const user = buildUser(UserRole.EXPERT);

			await expect(service.createSellOffer(user, dto)).rejects.toThrow(
				HttpForbiddenError,
			);
		});

		it('throws CATEGORY_NOT_FOUND when category does not exist', async () => {
			const user = buildUser(UserRole.SELLER);
			categoryRepository.exists.mockResolvedValue(false);

			await expect(service.createSellOffer(user, dto)).rejects.toThrow(
				HttpNotFoundError,
			);
		});

		it('creates post and returns view when SELLER with valid category', async () => {
			const user = buildUser(UserRole.SELLER);
			const post = buildPost();
			categoryRepository.exists.mockResolvedValue(true);
			tradePostRepository.create.mockResolvedValue(post);
			tradePostRepository.findOne.mockResolvedValue(post);

			const result = await service.createSellOffer(user, dto);

			expect(tradePostRepository.create).toHaveBeenCalledWith(
				expect.objectContaining({
					posterUserId: user.id,
					tradeType: TradeType.SELL,
					categoryId: dto.categoryId,
					status: TradeStatus.ACTIVE,
				}),
			);
			expect(result.id).toBe(post.id);
		});

		it('creates post and returns view when COOPERATIVE', async () => {
			const user = buildUser(UserRole.COOPERATIVE);
			const post = buildPost();
			categoryRepository.exists.mockResolvedValue(true);
			tradePostRepository.create.mockResolvedValue(post);
			tradePostRepository.findOne.mockResolvedValue(post);

			const result = await service.createSellOffer(user, dto);

			expect(result.id).toBe(post.id);
		});

		it('defaults listingDays to 14 when not provided in dto', async () => {
			const user = buildUser(UserRole.SELLER);
			const post = buildPost();
			categoryRepository.exists.mockResolvedValue(true);
			tradePostRepository.create.mockResolvedValue(post);
			tradePostRepository.findOne.mockResolvedValue(post);

			await service.createSellOffer(user, dto);

			expect(tradePostRepository.create).toHaveBeenCalledWith(
				expect.objectContaining({ listingDays: 14 }),
			);
		});

		it('uses listingDays from dto when provided', async () => {
			const user = buildUser(UserRole.ENTERPRISE);
			const post = buildPost();
			categoryRepository.exists.mockResolvedValue(true);
			tradePostRepository.create.mockResolvedValue(post);
			tradePostRepository.findOne.mockResolvedValue(post);

			await service.createSellOffer(user, { ...dto, listingDays: 7 });

			expect(tradePostRepository.create).toHaveBeenCalledWith(
				expect.objectContaining({ listingDays: 7 }),
			);
		});
	});

	// ─── createBuyRequest ─────────────────────────────────────────────────────

	describe('createBuyRequest', () => {
		const dto = {
			categoryId: 'cat-1',
			title: 'Need 100kg rice',
			quantity: 100,
			quantityUnit: 'kg',
		} as any;

		it('throws ROLE_FORBIDDEN when user is SELLER', async () => {
			const user = buildUser(UserRole.SELLER);

			await expect(service.createBuyRequest(user, dto)).rejects.toThrow(
				HttpForbiddenError,
			);
		});

		it('throws ROLE_FORBIDDEN when user is CONSUMER', async () => {
			const user = buildUser(UserRole.CONSUMER);

			await expect(service.createBuyRequest(user, dto)).rejects.toThrow(
				HttpForbiddenError,
			);
		});

		it('throws CATEGORY_NOT_FOUND when category does not exist', async () => {
			const user = buildUser(UserRole.ENTERPRISE);
			categoryRepository.exists.mockResolvedValue(false);

			await expect(service.createBuyRequest(user, dto)).rejects.toThrow(
				HttpNotFoundError,
			);
		});

		it('creates post with listingDays 30 for ENTERPRISE', async () => {
			const user = buildUser(UserRole.ENTERPRISE);
			const post = buildPost({ tradeType: TradeType.BUY });
			categoryRepository.exists.mockResolvedValue(true);
			tradePostRepository.create.mockResolvedValue(post);
			tradePostRepository.findOne.mockResolvedValue(post);

			await service.createBuyRequest(user, dto);

			expect(tradePostRepository.create).toHaveBeenCalledWith(
				expect.objectContaining({
					tradeType: TradeType.BUY,
					listingDays: 30,
					status: TradeStatus.ACTIVE,
				}),
			);
		});

		it('uses provided deadline as expiresAt when deadline is set', async () => {
			const user = buildUser(UserRole.COOPERATIVE);
			const deadline = '2026-12-31';
			const post = buildPost({ tradeType: TradeType.BUY });
			categoryRepository.exists.mockResolvedValue(true);
			tradePostRepository.create.mockResolvedValue(post);
			tradePostRepository.findOne.mockResolvedValue(post);

			await service.createBuyRequest(user, { ...dto, deadline });

			expect(tradePostRepository.create).toHaveBeenCalledWith(
				expect.objectContaining({
					deadline,
					expiresAt: new Date(deadline),
				}),
			);
		});

		it('defaults expiresAt to 30 days from now when no deadline', async () => {
			const user = buildUser(UserRole.COOPERATIVE);
			const post = buildPost({ tradeType: TradeType.BUY });
			categoryRepository.exists.mockResolvedValue(true);
			tradePostRepository.create.mockResolvedValue(post);
			tradePostRepository.findOne.mockResolvedValue(post);

			const before = Date.now();
			await service.createBuyRequest(user, dto);
			const after = Date.now();

			const createCall = tradePostRepository.create.mock.calls[0][0];
			const expiresAt: Date = createCall.expiresAt;
			const diffDays = (expiresAt.getTime() - before) / (1000 * 60 * 60 * 24);

			expect(diffDays).toBeGreaterThanOrEqual(29.9);
			expect(expiresAt.getTime()).toBeLessThanOrEqual(
				after + 30 * 24 * 60 * 60 * 1000 + 1000,
			);
		});
	});

	// ─── findAll ──────────────────────────────────────────────────────────────

	describe('findAll', () => {
		const query = { page: 1, limit: 10 } as any;

		it('returns correct pagination shape', async () => {
			const posts = [buildPost({ id: 'p-1' }), buildPost({ id: 'p-2' })];
			tradePostRepository.findWithFilters.mockResolvedValue({
				data: posts,
				total: 25,
			});

			const result = await service.findAll(query);

			expect(result.items).toHaveLength(2);
			expect(result.total).toBe(25);
			expect(result.page).toBe(1);
			expect(result.limit).toBe(10);
			expect(result.totalPage).toBe(3);
		});

		it('rounds totalPage up', async () => {
			tradePostRepository.findWithFilters.mockResolvedValue({
				data: [],
				total: 21,
			});

			const result = await service.findAll({ page: 1, limit: 10 } as any);

			expect(result.totalPage).toBe(3);
		});

		it('passes filters to repository', async () => {
			tradePostRepository.findWithFilters.mockResolvedValue({
				data: [],
				total: 0,
			});
			const q = {
				tradeType: TradeType.SELL,
				province: 'Hanoi',
				page: 2,
				limit: 5,
			} as any;

			await service.findAll(q);

			expect(tradePostRepository.findWithFilters).toHaveBeenCalledWith(
				expect.objectContaining({
					tradeType: TradeType.SELL,
					province: 'Hanoi',
					page: 2,
					limit: 5,
				}),
			);
		});
	});

	// ─── findOne ──────────────────────────────────────────────────────────────

	describe('findOne', () => {
		it('throws TRADE_POST_NOT_FOUND when post does not exist', async () => {
			tradePostRepository.findOne.mockResolvedValue(null);

			await expect(service.findOne('missing-id')).rejects.toThrow(
				HttpNotFoundError,
			);
		});

		it('returns view when post exists', async () => {
			const post = buildPost({
				posterUser: {
					id: 'user-1',
					username: 'alice',
					profile: { displayName: 'Alice' },
				},
				category: {
					id: 'cat-1',
					nameEn: 'Vegetables',
					nameVi: 'Rau củ',
					slug: 'vegetables',
				},
			});
			tradePostRepository.findOne.mockResolvedValue(post);

			const result = await service.findOne('post-1');

			expect(result.id).toBe('post-1');
			expect(result.poster?.username).toBe('alice');
			expect(result.category?.nameEn).toBe('Vegetables');
		});

		it('loads posterUser, posterUser.profile and category relations', async () => {
			tradePostRepository.findOne.mockResolvedValue(buildPost());

			await service.findOne('post-1');

			expect(tradePostRepository.findOne).toHaveBeenCalledWith(
				{ id: 'post-1' },
				['posterUser', 'posterUser.profile', 'category'],
			);
		});
	});

	// ─── update ───────────────────────────────────────────────────────────────

	describe('update', () => {
		const dto = { title: 'Updated title' } as any;

		it('throws TRADE_POST_NOT_FOUND when post does not exist', async () => {
			const user = buildUser(UserRole.SELLER);
			tradePostRepository.findOne.mockResolvedValue(null);

			await expect(service.update(user, 'missing-id', dto)).rejects.toThrow(
				HttpNotFoundError,
			);
		});

		it('throws TRADE_POST_FORBIDDEN when user is not the owner', async () => {
			const user = buildUser(UserRole.SELLER, 'user-2');
			tradePostRepository.findOne.mockResolvedValue(
				buildPost({ posterUserId: 'user-1' }),
			);

			await expect(service.update(user, 'post-1', dto)).rejects.toThrow(
				HttpForbiddenError,
			);
		});

		it('throws TRADE_POST_CANNOT_MODIFY when post is CLOSED', async () => {
			const user = buildUser(UserRole.SELLER, 'user-1');
			tradePostRepository.findOne.mockResolvedValue(
				buildPost({ posterUserId: 'user-1', status: TradeStatus.CLOSED }),
			);

			await expect(service.update(user, 'post-1', dto)).rejects.toThrow(
				HttpBadRequestError,
			);
		});

		it('throws TRADE_POST_CANNOT_MODIFY when post is EXPIRED', async () => {
			const user = buildUser(UserRole.SELLER, 'user-1');
			tradePostRepository.findOne.mockResolvedValue(
				buildPost({ posterUserId: 'user-1', status: TradeStatus.EXPIRED }),
			);

			await expect(service.update(user, 'post-1', dto)).rejects.toThrow(
				HttpBadRequestError,
			);
		});

		it('calls repository update and returns refreshed view on success', async () => {
			const user = buildUser(UserRole.SELLER, 'user-1');
			const post = buildPost({ posterUserId: 'user-1' });
			const updatedPost = buildPost({
				posterUserId: 'user-1',
				title: 'Updated title',
			});

			tradePostRepository.findOne
				.mockResolvedValueOnce(post) // first call inside update()
				.mockResolvedValueOnce(updatedPost); // second call inside findOne()

			const result = await service.update(user, 'post-1', dto);

			expect(tradePostRepository.update).toHaveBeenCalledWith('post-1', dto);
			expect(result.id).toBe('post-1');
		});
	});

	// ─── close ────────────────────────────────────────────────────────────────

	describe('close', () => {
		it('throws TRADE_POST_NOT_FOUND when post does not exist', async () => {
			const user = buildUser(UserRole.SELLER);
			tradePostRepository.findOne.mockResolvedValue(null);

			await expect(service.close(user, 'missing-id')).rejects.toThrow(
				HttpNotFoundError,
			);
		});

		it('throws TRADE_POST_FORBIDDEN when user is not the owner', async () => {
			const user = buildUser(UserRole.SELLER, 'user-2');
			tradePostRepository.findOne.mockResolvedValue(
				buildPost({ posterUserId: 'user-1' }),
			);

			await expect(service.close(user, 'post-1')).rejects.toThrow(
				HttpForbiddenError,
			);
		});

		it('sets status to CLOSED and returns refreshed view on success', async () => {
			const user = buildUser(UserRole.SELLER, 'user-1');
			const post = buildPost({ posterUserId: 'user-1' });
			const closedPost = buildPost({
				posterUserId: 'user-1',
				status: TradeStatus.CLOSED,
			});

			tradePostRepository.findOne
				.mockResolvedValueOnce(post)
				.mockResolvedValueOnce(closedPost);

			const result = await service.close(user, 'post-1');

			expect(tradePostRepository.update).toHaveBeenCalledWith('post-1', {
				status: TradeStatus.CLOSED,
			});
			expect(result.id).toBe('post-1');
		});
	});
});
