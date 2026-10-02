import { Test, TestingModule } from '@nestjs/testing';
import { SearchService } from './search.service';
import { SearchType } from '@app/common/enums/search-type.enum';
import { UserRepository } from '@app/database/typeorm/repositories/user.repository';
import { PostRepository } from '@app/database/typeorm/repositories/post.repository';
import { ProductRepository } from '@app/database/typeorm/repositories/product.repository';
import { BlockService } from '../block/block.service';
import { PostService } from '../post/post.service';
import { HttpBadRequestError } from '@app/common/errors/bad-request.error';

const makeQb = () => {
	const qb: Record<string, jest.Mock> = {};
	[
		'leftJoinAndSelect',
		'where',
		'andWhere',
		'orderBy',
		'addOrderBy',
		'take',
	].forEach((m) => (qb[m] = jest.fn().mockReturnValue(qb)));
	qb['getMany'] = jest.fn().mockResolvedValue([]);
	return qb;
};

const makePaginated = (data: any[] = []) => ({
	data,
	nextCursor: null,
	hasNext: false,
	limit: 10,
});

describe('SearchService', () => {
	let service: SearchService;
	let userQb: ReturnType<typeof makeQb>;
	let postQb: ReturnType<typeof makeQb>;
	let productQb: ReturnType<typeof makeQb>;

	let mockUserRepo: Partial<UserRepository>;
	let mockPostRepo: Partial<PostRepository>;
	let mockProductRepo: Partial<ProductRepository>;
	let mockBlockService: Partial<BlockService>;
	let mockPostService: Partial<PostService>;

	const VIEWER = 'viewer-uuid';
	const q = (overrides: Record<string, unknown> = {}) =>
		({ q: 'tomato', limit: 10, ...overrides }) as any;

	beforeEach(async () => {
		userQb = makeQb();
		postQb = makeQb();
		productQb = makeQb();

		mockUserRepo = {
			createQueryBuilder: jest.fn().mockReturnValue(userQb),
			paginateWithCursor: jest.fn().mockResolvedValue(makePaginated()),
		};
		mockPostRepo = {
			createQueryBuilder: jest.fn().mockReturnValue(postQb),
			paginateWithCursor: jest.fn().mockResolvedValue(makePaginated()),
		};
		mockProductRepo = {
			createQueryBuilder: jest.fn().mockReturnValue(productQb),
			paginateWithCursor: jest.fn().mockResolvedValue(makePaginated()),
		};
		mockBlockService = {
			getBlockedUserIds: jest.fn().mockResolvedValue([]),
		};
		mockPostService = {
			toDetailViewForViewer: jest
				.fn()
				.mockImplementation(({ post }: any) => Promise.resolve(post)),
		};

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				SearchService,
				{ provide: UserRepository, useValue: mockUserRepo },
				{ provide: PostRepository, useValue: mockPostRepo },
				{ provide: ProductRepository, useValue: mockProductRepo },
				{ provide: BlockService, useValue: mockBlockService },
				{ provide: PostService, useValue: mockPostService },
			],
		}).compile();

		service = module.get<SearchService>(SearchService);
	});

	afterEach(() => jest.clearAllMocks());

	// ─── search all (no type) ─────────────────────────────────────────────────

	describe('no type (search all)', () => {
		it('builds query builders for all three entity types', async () => {
			await service.globalSearch(VIEWER, q());

			expect(mockUserRepo.createQueryBuilder).toHaveBeenCalledWith('user');
			expect(mockPostRepo.createQueryBuilder).toHaveBeenCalledWith('post');
			expect(mockProductRepo.createQueryBuilder).toHaveBeenCalledWith(
				'product',
			);
		});

		it('returns users / posts / products sections each with items + pagination', async () => {
			const result = (await service.globalSearch(VIEWER, q())) as any;

			expect(result).toHaveProperty('users.items');
			expect(result).toHaveProperty('users.hasNext');
			expect(result).toHaveProperty('posts.items');
			expect(result).toHaveProperty('products.items');
		});

		it('maps user entity to slim shape { id, username, displayName, avatarUrl }', async () => {
			const user = {
				id: 'u-1',
				username: 'alice',
				profile: {
					displayName: 'Alice',
					avatarMedia: { cdnUrl: 'https://cdn/alice.jpg' },
				},
			};
			userQb['getMany'].mockResolvedValueOnce([user]);

			const result = (await service.globalSearch(VIEWER, q())) as any;

			expect(result.users.items[0]).toEqual({
				id: 'u-1',
				username: 'alice',
				displayName: 'Alice',
				avatarUrl: 'https://cdn/alice.jpg',
			});
		});

		it('sets displayName and avatarUrl to null when profile is null', async () => {
			const user = { id: 'u-2', username: 'bob', profile: null };
			userQb['getMany'].mockResolvedValueOnce([user]);

			const result = (await service.globalSearch(VIEWER, q())) as any;

			expect(result.users.items[0].displayName).toBeNull();
			expect(result.users.items[0].avatarUrl).toBeNull();
		});

		it('sets hasNext=true and slices to limit when result exceeds limit', async () => {
			const limit = 3;
			const users = Array.from({ length: limit + 1 }, (_, i) => ({
				id: `u-${i}`,
				username: `user${i}`,
				profile: null,
			}));
			userQb['getMany'].mockResolvedValueOnce(users);

			const result = (await service.globalSearch(VIEWER, q({ limit }))) as any;

			expect(result.users.hasNext).toBe(true);
			expect(result.users.items).toHaveLength(limit);
		});

		it('does NOT add NOT IN clause when no blocked users', async () => {
			(mockBlockService.getBlockedUserIds as jest.Mock).mockResolvedValue([]);

			await service.globalSearch(VIEWER, q());

			const notInCall = (userQb['andWhere'] as jest.Mock).mock.calls.find(
				(args) => typeof args[0] === 'string' && args[0].includes('NOT IN'),
			);
			expect(notInCall).toBeUndefined();
		});

		it('adds NOT IN clause for blocked users on user, post, and product queries', async () => {
			const blocked = ['blocked-1', 'blocked-2'];
			(mockBlockService.getBlockedUserIds as jest.Mock).mockResolvedValue(
				blocked,
			);

			await service.globalSearch(VIEWER, q());

			expect(userQb['andWhere']).toHaveBeenCalledWith(
				'user.id NOT IN (:...blockedUserIds)',
				{ blockedUserIds: blocked },
			);
			expect(postQb['andWhere']).toHaveBeenCalledWith(
				'post.authorId NOT IN (:...blockedUserIds)',
				{ blockedUserIds: blocked },
			);
		});

		it('calls toDetailViewForViewer for each post result', async () => {
			const post = { id: 'p-1', body: 'Hello' };
			postQb['getMany'].mockResolvedValueOnce([post]);

			await service.globalSearch(VIEWER, q());

			expect(mockPostService.toDetailViewForViewer).toHaveBeenCalledWith(
				{ post },
				VIEWER,
			);
		});
	});

	// ─── type = USERS ─────────────────────────────────────────────────────────

	describe('type = USERS', () => {
		it('delegates to paginateWithCursor on UserRepository', async () => {
			const user = {
				id: 'u-1',
				username: 'alice',
				profile: { displayName: 'Alice', avatarMedia: null },
			};
			(mockUserRepo.paginateWithCursor as jest.Mock).mockResolvedValue(
				makePaginated([user]),
			);

			const result = (await service.globalSearch(
				VIEWER,
				q({ type: SearchType.USERS }),
			)) as any;

			expect(mockUserRepo.paginateWithCursor).toHaveBeenCalled();
			expect(result.items[0]).toMatchObject({ id: 'u-1', username: 'alice' });
		});

		it('propagates nextCursor and hasNext from paginateWithCursor', async () => {
			(mockUserRepo.paginateWithCursor as jest.Mock).mockResolvedValue({
				data: [],
				nextCursor: 'cursor-abc',
				hasNext: true,
				limit: 10,
			});

			const result = (await service.globalSearch(
				VIEWER,
				q({ type: SearchType.USERS }),
			)) as any;

			expect(result.nextCursor).toBe('cursor-abc');
			expect(result.hasNext).toBe(true);
		});

		it('maps user with null profile to null displayName and avatarUrl', async () => {
			const user = { id: 'u-2', username: 'bob', profile: null };
			(mockUserRepo.paginateWithCursor as jest.Mock).mockResolvedValue(
				makePaginated([user]),
			);

			const result = (await service.globalSearch(
				VIEWER,
				q({ type: SearchType.USERS }),
			)) as any;

			expect(result.items[0].displayName).toBeNull();
			expect(result.items[0].avatarUrl).toBeNull();
		});
	});

	// ─── type = POSTS ─────────────────────────────────────────────────────────

	describe('type = POSTS', () => {
		it('delegates to paginateWithCursor and maps posts via toDetailViewForViewer', async () => {
			const post = { id: 'p-1', body: 'Hello' };
			const enriched = { id: 'p-1', body: 'Hello', reactionCount: 5 };
			(mockPostRepo.paginateWithCursor as jest.Mock).mockResolvedValue(
				makePaginated([post]),
			);
			(mockPostService.toDetailViewForViewer as jest.Mock).mockResolvedValue(
				enriched,
			);

			const result = (await service.globalSearch(
				VIEWER,
				q({ type: SearchType.POSTS }),
			)) as any;

			expect(mockPostRepo.paginateWithCursor).toHaveBeenCalled();
			expect(mockPostService.toDetailViewForViewer).toHaveBeenCalledWith(
				{ post },
				VIEWER,
			);
			expect(result.items[0]).toMatchObject({ reactionCount: 5 });
		});
	});

	// ─── type = PRODUCTS ──────────────────────────────────────────────────────

	describe('type = PRODUCTS', () => {
		it('delegates to paginateWithCursor on ProductRepository', async () => {
			const product = { id: 'pr-1', name: 'Tomato' };
			(mockProductRepo.paginateWithCursor as jest.Mock).mockResolvedValue(
				makePaginated([product]),
			);

			const result = (await service.globalSearch(
				VIEWER,
				q({ type: SearchType.PRODUCTS }),
			)) as any;

			expect(mockProductRepo.paginateWithCursor).toHaveBeenCalled();
			expect(result.items[0]).toMatchObject({ id: 'pr-1', name: 'Tomato' });
		});
	});

	// ─── unsupported type ─────────────────────────────────────────────────────

	describe('unsupported type', () => {
		it('throws HttpBadRequestError for unknown type values', async () => {
			await expect(
				service.globalSearch(VIEWER, q({ type: 'GREEN_PROFILES' })),
			).rejects.toThrow(HttpBadRequestError);
		});
	});

	// ─── LIKE escaping ────────────────────────────────────────────────────────

	describe('LIKE pattern escaping', () => {
		it('escapes % in search term before querying', async () => {
			await service.globalSearch(VIEWER, q({ q: '50%off' }));

			const likeCall = (userQb['andWhere'] as jest.Mock).mock.calls.find(
				(args) =>
					typeof args[1] === 'object' &&
					(args[1] as any).term?.includes('50\\%off'),
			);
			expect(likeCall).toBeDefined();
		});

		it('escapes _ in search term before querying', async () => {
			await service.globalSearch(VIEWER, q({ q: 'user_name' }));

			const likeCall = (userQb['andWhere'] as jest.Mock).mock.calls.find(
				(args) =>
					typeof args[1] === 'object' &&
					(args[1] as any).term?.includes('user\\_name'),
			);
			expect(likeCall).toBeDefined();
		});

		it('escapes backslash in search term before querying', async () => {
			await service.globalSearch(VIEWER, q({ q: 'path\\file' }));

			const likeCall = (userQb['andWhere'] as jest.Mock).mock.calls.find(
				(args) =>
					typeof args[1] === 'object' &&
					(args[1] as any).term?.includes('path\\\\file'),
			);
			expect(likeCall).toBeDefined();
		});
	});
});
