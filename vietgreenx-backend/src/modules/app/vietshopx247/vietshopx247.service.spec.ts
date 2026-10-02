import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Vsx247Service } from './vietshopx247.service';
import { Post } from '@app/database/typeorm/entities/content/post.entity';
import { UserRepository } from '@app/database/typeorm/repositories/user.repository';
import { PostSource } from '@app/common/enums/post-source.enum';
import { UserStatus } from '@app/common/enums/user-status.enum';
import { HttpNotFoundError, HttpBadRequestError } from '@app/common/errors';

// ─── Mock factories ───────────────────────────────────────────────────────────

const createMockUserRepository = () => ({
	findOne: jest.fn(),
});

const createMockPostRepository = () => ({
	create: jest.fn(),
	save: jest.fn(),
	findOne: jest.fn(),
});

const createMockDataSource = () => ({
	query: jest.fn().mockResolvedValue(undefined),
});

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const ACTIVE_USER = {
	id: 'user-uuid-1',
	status: UserStatus.ACTIVE,
};

const INACTIVE_USER = {
	id: 'user-uuid-2',
	status: UserStatus.SUSPENDED,
};

const BASE_SHARE_DTO = {
	vgxUserId: 'user-uuid-1',
	productId: 'prod-1',
	productName: 'Gạo ST25',
	productImageUrl: 'https://example.com/image.jpg',
	productPrice: 150000,
	priceCurrency: 'VND',
	storeName: 'Shop A',
	storeId: 'store-1',
	categoryName: 'Thực phẩm',
	externalUrl: 'https://vietshopx247.com/product/prod-1',
};

const SAVED_POST = {
	id: 'post-uuid-1',
	authorId: 'user-uuid-1',
	source: PostSource.VIETSHOPX247,
	externalUrl: BASE_SHARE_DTO.externalUrl,
	sourceMetadata: {
		productId: 'prod-1',
		productName: 'Gạo ST25',
		productImageUrl: 'https://example.com/image.jpg',
		productPrice: 150000,
		priceCurrency: 'VND',
		storeName: 'Shop A',
		storeId: 'store-1',
		categoryName: 'Thực phẩm',
	},
	createdAt: new Date('2026-01-01'),
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Vsx247Service', () => {
	let service: Vsx247Service;
	let userRepository: ReturnType<typeof createMockUserRepository>;
	let postRepository: ReturnType<typeof createMockPostRepository>;
	let dataSource: ReturnType<typeof createMockDataSource>;

	beforeEach(async () => {
		userRepository = createMockUserRepository();
		postRepository = createMockPostRepository();
		dataSource = createMockDataSource();

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				Vsx247Service,
				{ provide: UserRepository, useValue: userRepository },
				{ provide: getRepositoryToken(Post), useValue: postRepository },
				{ provide: DataSource, useValue: dataSource },
			],
		}).compile();

		service = module.get<Vsx247Service>(Vsx247Service);
	});

	afterEach(() => jest.clearAllMocks());

	// ─── receiveShare ─────────────────────────────────────────────────────────

	describe('receiveShare', () => {
		it('throws HttpNotFoundError when user is not found', async () => {
			userRepository.findOne.mockResolvedValue(null);

			await expect(service.receiveShare(BASE_SHARE_DTO)).rejects.toThrow(
				HttpNotFoundError,
			);
		});

		it('throws HttpBadRequestError when user is inactive', async () => {
			userRepository.findOne.mockResolvedValue(INACTIVE_USER);

			await expect(service.receiveShare(BASE_SHARE_DTO)).rejects.toThrow(
				HttpBadRequestError,
			);
		});

		it('calls postRepository.create with source=VIETSHOPX247 and calls save', async () => {
			userRepository.findOne.mockResolvedValue(ACTIVE_USER);
			const created = { ...SAVED_POST };
			postRepository.create.mockReturnValue(created);
			postRepository.save.mockResolvedValue(SAVED_POST);

			await service.receiveShare(BASE_SHARE_DTO);

			expect(postRepository.create).toHaveBeenCalledWith(
				expect.objectContaining({ source: PostSource.VIETSHOPX247 }),
			);
			expect(postRepository.save).toHaveBeenCalledWith(created);
		});

		it('returns the mapped view with postId, authorId, source, externalUrl, sourceMetadata, createdAt', async () => {
			userRepository.findOne.mockResolvedValue(ACTIVE_USER);
			postRepository.create.mockReturnValue(SAVED_POST);
			postRepository.save.mockResolvedValue(SAVED_POST);

			const result = await service.receiveShare(BASE_SHARE_DTO);

			expect(result).toEqual({
				postId: SAVED_POST.id,
				authorId: SAVED_POST.authorId,
				source: SAVED_POST.source,
				externalUrl: SAVED_POST.externalUrl,
				sourceMetadata: SAVED_POST.sourceMetadata,
				createdAt: SAVED_POST.createdAt,
			});
		});

		it('sets null for optional fields (productImageUrl, productPrice, categoryName) when omitted', async () => {
			userRepository.findOne.mockResolvedValue(ACTIVE_USER);

			const dtoWithoutOptionals = {
				vgxUserId: 'user-uuid-1',
				productId: 'prod-1',
				productName: 'Gạo ST25',
				priceCurrency: 'VND',
				storeName: 'Shop A',
				storeId: 'store-1',
				externalUrl: 'https://vietshopx247.com/product/prod-1',
			};

			const savedPost = {
				...SAVED_POST,
				sourceMetadata: {
					productId: 'prod-1',
					productName: 'Gạo ST25',
					productImageUrl: null,
					productPrice: null,
					priceCurrency: 'VND',
					storeName: 'Shop A',
					storeId: 'store-1',
					categoryName: null,
				},
			};

			postRepository.create.mockReturnValue(savedPost);
			postRepository.save.mockResolvedValue(savedPost);

			await service.receiveShare(dtoWithoutOptionals as any);

			expect(postRepository.create).toHaveBeenCalledWith(
				expect.objectContaining({
					sourceMetadata: expect.objectContaining({
						productImageUrl: null,
						productPrice: null,
						categoryName: null,
					}),
				}),
			);
		});
	});

	// ─── trackClick ──────────────────────────────────────────────────────────

	describe('trackClick', () => {
		it('throws HttpNotFoundError when post is not found', async () => {
			postRepository.findOne.mockResolvedValue(null);

			await expect(service.trackClick('non-existent-post')).rejects.toThrow(
				HttpNotFoundError,
			);
		});

		it('throws HttpBadRequestError when post source is not VIETSHOPX247', async () => {
			postRepository.findOne.mockResolvedValue({
				id: 'post-uuid-1',
				source: 'organic',
			});

			await expect(service.trackClick('post-uuid-1')).rejects.toThrow(
				HttpBadRequestError,
			);
		});

		it('calls dataSource.query with the correct SQL and postId param', async () => {
			postRepository.findOne.mockResolvedValue({
				id: 'post-uuid-1',
				source: PostSource.VIETSHOPX247,
			});

			await service.trackClick('post-uuid-1');

			expect(dataSource.query).toHaveBeenCalledWith(
				`UPDATE content.posts SET external_click_count = external_click_count + 1 WHERE id = $1`,
				['post-uuid-1'],
			);
		});

		it('returns { postId, tracked: true } on success', async () => {
			postRepository.findOne.mockResolvedValue({
				id: 'post-uuid-1',
				source: PostSource.VIETSHOPX247,
			});

			const result = await service.trackClick('post-uuid-1');

			expect(result).toEqual({ postId: 'post-uuid-1', tracked: true });
		});
	});
});
