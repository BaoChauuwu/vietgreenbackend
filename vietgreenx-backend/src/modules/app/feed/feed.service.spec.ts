import { Test, TestingModule } from '@nestjs/testing';
import { FeedService } from './feed.service';
import { PostRepository } from '@app/database/typeorm/repositories/post.repository';
import { PostService } from '@app/modules/app/post/post.service';
import { BlockService } from '@app/modules/app/block/block.service';
import { FeedMode } from '@app/common/enums/feed-mode.enum';
import { FeedQueryDto } from './dto/requests/feed.query.dto';

const mockSelectQueryBuilder = () => {
	const qb: any = {
		leftJoinAndSelect: jest.fn().mockReturnThis(),
		where: jest.fn().mockReturnThis(),
		andWhere: jest.fn().mockReturnThis(),
		orderBy: jest.fn().mockReturnThis(),
		addOrderBy: jest.fn().mockReturnThis(),
	};
	return qb;
};

const createMockPostRepository = () => ({
	createQueryBuilder: jest.fn(),
	paginateWithCursor: jest.fn(),
});

const createMockPostService = () => ({
	toDetailViewForViewer: jest.fn(),
});

const createMockBlockService = () => ({
	getBlockedUserIds: jest.fn().mockResolvedValue([]),
});

describe('FeedService', () => {
	let service: FeedService;
	let postRepository: ReturnType<typeof createMockPostRepository>;
	let postService: ReturnType<typeof createMockPostService>;
	let blockService: ReturnType<typeof createMockBlockService>;

	beforeEach(async () => {
		postRepository = createMockPostRepository();
		postService = createMockPostService();
		blockService = createMockBlockService();

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				FeedService,
				{ provide: PostRepository, useValue: postRepository },
				{ provide: PostService, useValue: postService },
				{ provide: BlockService, useValue: blockService },
			],
		}).compile();

		service = module.get<FeedService>(FeedService);
	});

	afterEach(() => jest.clearAllMocks());

	const buildQuery = (overrides: Partial<FeedQueryDto> = {}): FeedQueryDto =>
		({ limit: 20, ...overrides }) as FeedQueryDto;

	const setupPagination = (posts: any[] = []) => {
		const qb = mockSelectQueryBuilder();
		postRepository.createQueryBuilder.mockReturnValue(qb);
		postRepository.paginateWithCursor.mockResolvedValue({
			data: posts,
			nextCursor: null,
			hasNext: false,
			limit: 20,
		});
		postService.toDetailViewForViewer.mockImplementation(({ post }) =>
			Promise.resolve({ ...post, likedByViewer: false }),
		);
		return qb;
	};

	// ─── DISCOVERY mode ───────────────────────────────────────────────────────

	describe('discovery mode (default)', () => {
		it('returns paginated feed with items and nextCursor', async () => {
			const posts = [{ id: 'post-1' }, { id: 'post-2' }];
			setupPagination(posts);

			const result = await service.getFeed('user-1', buildQuery());

			expect(result.items).toHaveLength(2);
			expect(result.hasNext).toBe(false);
			expect(result.nextCursor).toBeNull();
		});

		it('filters by PUBLIC visibility in discovery mode', async () => {
			const qb = setupPagination();

			await service.getFeed('user-1', buildQuery({ mode: FeedMode.DISCOVERY }));

			expect(qb.andWhere).toHaveBeenCalledWith(
				'post.visibility = :visibility',
				expect.objectContaining({ visibility: 'public' }),
			);
		});

		it('passes limit from query to paginateWithCursor', async () => {
			setupPagination();

			await service.getFeed('user-1', buildQuery({ limit: 10 }));

			expect(postRepository.paginateWithCursor).toHaveBeenCalledWith(
				expect.anything(),
				['createdAt', 'id'],
				undefined,
				10,
			);
		});

		it('filters out blocked user posts', async () => {
			const qb = mockSelectQueryBuilder();
			postRepository.createQueryBuilder.mockReturnValue(qb);
			blockService.getBlockedUserIds.mockResolvedValue(['blocked-user-1']);
			postRepository.paginateWithCursor.mockResolvedValue({
				data: [],
				nextCursor: null,
				hasNext: false,
				limit: 20,
			});

			await service.getFeed('user-1', buildQuery());

			expect(qb.andWhere).toHaveBeenCalledWith(
				'post.authorId NOT IN (:...blockedUserIds)',
				{ blockedUserIds: ['blocked-user-1'] },
			);
		});

		it('does not add blocked filter when no blocked users', async () => {
			const qb = setupPagination();
			blockService.getBlockedUserIds.mockResolvedValue([]);

			await service.getFeed('user-1', buildQuery());

			const blockedCall = (qb.andWhere as jest.Mock).mock.calls.find(
				(args) =>
					typeof args[0] === 'string' && args[0].includes('blockedUserIds'),
			);
			expect(blockedCall).toBeUndefined();
		});

		it('applies category filter when provided', async () => {
			const qb = setupPagination();

			await service.getFeed(
				'user-1',
				buildQuery({ category: 'technology' as any }),
			);

			expect(qb.andWhere).toHaveBeenCalledWith('post.category = :category', {
				category: 'technology',
			});
		});

		it('defaults to limit 20 when not specified', async () => {
			setupPagination();

			await service.getFeed('user-1', buildQuery({ limit: undefined }));

			expect(postRepository.paginateWithCursor).toHaveBeenCalledWith(
				expect.anything(),
				expect.anything(),
				undefined,
				20,
			);
		});

		it('maps each post through toDetailViewForViewer', async () => {
			const posts = [{ id: 'p1' }, { id: 'p2' }, { id: 'p3' }];
			setupPagination(posts);

			await service.getFeed('user-1', buildQuery());

			expect(postService.toDetailViewForViewer).toHaveBeenCalledTimes(3);
			posts.forEach((post) => {
				expect(postService.toDetailViewForViewer).toHaveBeenCalledWith(
					{ post },
					'user-1',
				);
			});
		});
	});

	// ─── FOLLOWING mode ───────────────────────────────────────────────────────

	describe('following mode', () => {
		it('uses Brackets instead of simple visibility filter', async () => {
			const qb = mockSelectQueryBuilder();
			postRepository.createQueryBuilder.mockReturnValue(qb);
			postRepository.paginateWithCursor.mockResolvedValue({
				data: [],
				nextCursor: null,
				hasNext: false,
				limit: 20,
			});

			await service.getFeed('user-1', buildQuery({ mode: FeedMode.FOLLOWING }));

			const publicVisibilityCall = (qb.andWhere as jest.Mock).mock.calls.find(
				(args) =>
					typeof args[0] === 'string' &&
					args[0].includes('post.visibility = :visibility'),
			);
			expect(publicVisibilityCall).toBeUndefined();
		});

		it('returns empty items when no posts exist for followed users', async () => {
			setupPagination([]);

			const result = await service.getFeed(
				'user-1',
				buildQuery({ mode: FeedMode.FOLLOWING }),
			);

			expect(result.items).toHaveLength(0);
			expect(result.hasNext).toBe(false);
		});
	});

	// ─── cursor pagination ─────────────────────────────────────────────────────

	describe('cursor pagination', () => {
		it('passes cursor to paginateWithCursor when provided', async () => {
			setupPagination();
			const cursor = 'eyJjcmVhdGVkQXQiOiIyMDI0LTAxLTAxIn0=';

			await service.getFeed('user-1', buildQuery({ cursor }));

			expect(postRepository.paginateWithCursor).toHaveBeenCalledWith(
				expect.anything(),
				expect.anything(),
				cursor,
				20,
			);
		});

		it('forwards nextCursor from repository in response', async () => {
			const qb = mockSelectQueryBuilder();
			postRepository.createQueryBuilder.mockReturnValue(qb);
			postRepository.paginateWithCursor.mockResolvedValue({
				data: [],
				nextCursor: 'next-cursor-token',
				hasNext: true,
				limit: 20,
			});

			const result = await service.getFeed('user-1', buildQuery());

			expect(result.nextCursor).toBe('next-cursor-token');
			expect(result.hasNext).toBe(true);
		});
	});
});
