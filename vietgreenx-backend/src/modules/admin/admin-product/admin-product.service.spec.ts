import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { AdminProductService } from './admin-product.service';
import { ProductRepository } from '@app/database/typeorm/repositories/product.repository';
import { ProductStatus } from '@app/common/enums/product-status.enum';
import { HttpNotFoundError } from '@app/common/errors';
import { AdminProductQueryRequestDto } from './dto/requests/admin-product-query.request.dto';

// ─── QueryBuilder mock ────────────────────────────────────────────────────────

const mockSelectQueryBuilder = () => {
	const qb: any = {
		select: jest.fn().mockReturnThis(),
		from: jest.fn().mockReturnThis(),
		leftJoin: jest.fn().mockReturnThis(),
		where: jest.fn().mockReturnThis(),
		andWhere: jest.fn().mockReturnThis(),
		orderBy: jest.fn().mockReturnThis(),
		offset: jest.fn().mockReturnThis(),
		limit: jest.fn().mockReturnThis(),
		getCount: jest.fn().mockResolvedValue(0),
		getRawMany: jest.fn().mockResolvedValue([]),
		getRawOne: jest.fn().mockResolvedValue(null),
	};
	return qb;
};

// ─── Mock factories ───────────────────────────────────────────────────────────

const createMockProductRepository = () => ({
	findOne: jest.fn(),
	update: jest.fn(),
});

const createMockDataSource = () => ({
	createQueryBuilder: jest.fn(),
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

const buildQuery = (
	overrides: Partial<AdminProductQueryRequestDto> = {},
): AdminProductQueryRequestDto =>
	({ page: 1, limit: 10, ...overrides }) as AdminProductQueryRequestDto;

const PRODUCT_ROW = {
	id: 'product-uuid-1',
	name: 'Test Product',
	status: ProductStatus.ACTIVE,
	province: 'Hanoi',
	categoryId: 'cat-uuid-1',
	categoryNameEn: 'Vegetables',
	ownerUserId: 'user-uuid-1',
	ownerUsername: 'farmer1',
	ownerDisplayName: 'Farmer One',
	createdAt: new Date('2025-01-01'),
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('AdminProductService', () => {
	let service: AdminProductService;
	let productRepository: ReturnType<typeof createMockProductRepository>;
	let dataSource: ReturnType<typeof createMockDataSource>;

	beforeEach(async () => {
		productRepository = createMockProductRepository();
		dataSource = createMockDataSource();

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				AdminProductService,
				{ provide: ProductRepository, useValue: productRepository },
				{ provide: DataSource, useValue: dataSource },
			],
		}).compile();

		service = module.get<AdminProductService>(AdminProductService);
	});

	afterEach(() => jest.clearAllMocks());

	// ─── findAll ──────────────────────────────────────────────────────────────

	describe('findAll', () => {
		it('returns a pagination envelope with items and computed totalPage', async () => {
			const qb = mockSelectQueryBuilder();
			qb.getCount.mockResolvedValue(25);
			qb.getRawMany.mockResolvedValue([
				PRODUCT_ROW,
				{ ...PRODUCT_ROW, id: 'p2' },
			]);
			dataSource.createQueryBuilder.mockReturnValue(qb);

			const result = await service.findAll(buildQuery({ page: 1, limit: 10 }));

			expect(result.items).toHaveLength(2);
			expect(result.total).toBe(25);
			expect(result.page).toBe(1);
			expect(result.limit).toBe(10);
			expect(result.totalPage).toBe(3);
		});

		it('calls offset with (page-1)*limit and limit with correct value', async () => {
			const qb = mockSelectQueryBuilder();
			dataSource.createQueryBuilder.mockReturnValue(qb);

			await service.findAll(buildQuery({ page: 3, limit: 5 }));

			expect(qb.offset).toHaveBeenCalledWith(10); // (3-1)*5
			expect(qb.limit).toHaveBeenCalledWith(5);
		});

		it('applies province filter when province is provided', async () => {
			const qb = mockSelectQueryBuilder();
			dataSource.createQueryBuilder.mockReturnValue(qb);

			await service.findAll(buildQuery({ province: 'Hanoi' }));

			expect(qb.andWhere).toHaveBeenCalledWith('p.province = :province', {
				province: 'Hanoi',
			});
		});

		it('applies categoryId filter when categoryId is provided', async () => {
			const qb = mockSelectQueryBuilder();
			dataSource.createQueryBuilder.mockReturnValue(qb);

			await service.findAll(buildQuery({ categoryId: 'cat-uuid-1' }));

			expect(qb.andWhere).toHaveBeenCalledWith('p.category_id = :categoryId', {
				categoryId: 'cat-uuid-1',
			});
		});

		it('applies status filter when status is provided', async () => {
			const qb = mockSelectQueryBuilder();
			dataSource.createQueryBuilder.mockReturnValue(qb);

			await service.findAll(buildQuery({ status: ProductStatus.ACTIVE }));

			expect(qb.andWhere).toHaveBeenCalledWith('p.status = :status', {
				status: ProductStatus.ACTIVE,
			});
		});

		it('applies has_qr = true filter when hasQr is true', async () => {
			const qb = mockSelectQueryBuilder();
			dataSource.createQueryBuilder.mockReturnValue(qb);

			await service.findAll(buildQuery({ hasQr: true }));

			expect(qb.andWhere).toHaveBeenCalledWith('p.has_qr = true');
		});

		it('applies has_qr = false filter when hasQr is false', async () => {
			const qb = mockSelectQueryBuilder();
			dataSource.createQueryBuilder.mockReturnValue(qb);

			await service.findAll(buildQuery({ hasQr: false }));

			expect(qb.andWhere).toHaveBeenCalledWith('p.has_qr = false');
		});

		it('does not apply any optional filter when none are provided', async () => {
			const qb = mockSelectQueryBuilder();
			dataSource.createQueryBuilder.mockReturnValue(qb);

			await service.findAll(buildQuery());

			expect(qb.andWhere).not.toHaveBeenCalled();
		});

		it('applies all filters simultaneously when all are provided', async () => {
			const qb = mockSelectQueryBuilder();
			dataSource.createQueryBuilder.mockReturnValue(qb);

			await service.findAll(
				buildQuery({
					province: 'HCMC',
					categoryId: 'cat-2',
					status: ProductStatus.ACTIVE,
					hasQr: true,
				}),
			);

			expect(qb.andWhere).toHaveBeenCalledTimes(4);
		});

		it('orders results by created_at DESC', async () => {
			const qb = mockSelectQueryBuilder();
			dataSource.createQueryBuilder.mockReturnValue(qb);

			await service.findAll(buildQuery());

			expect(qb.orderBy).toHaveBeenCalledWith('p.created_at', 'DESC');
		});

		it('returns empty items array and total 0 when no products exist', async () => {
			const qb = mockSelectQueryBuilder();
			qb.getCount.mockResolvedValue(0);
			qb.getRawMany.mockResolvedValue([]);
			dataSource.createQueryBuilder.mockReturnValue(qb);

			const result = await service.findAll(buildQuery());

			expect(result.items).toHaveLength(0);
			expect(result.total).toBe(0);
			expect(result.totalPage).toBe(0);
		});

		it('computes totalPage as ceiling of total/limit', async () => {
			const qb = mockSelectQueryBuilder();
			qb.getCount.mockResolvedValue(11);
			dataSource.createQueryBuilder.mockReturnValue(qb);

			const result = await service.findAll(buildQuery({ limit: 5 }));

			expect(result.totalPage).toBe(3); // ceil(11/5)
		});
	});

	// ─── findOne ──────────────────────────────────────────────────────────────

	describe('findOne', () => {
		it('returns the product row when the product exists', async () => {
			const qb = mockSelectQueryBuilder();
			qb.getRawOne.mockResolvedValue(PRODUCT_ROW);
			dataSource.createQueryBuilder.mockReturnValue(qb);

			const result = await service.findOne('product-uuid-1');

			expect(result).toEqual(PRODUCT_ROW);
		});

		it('filters by the given id', async () => {
			const qb = mockSelectQueryBuilder();
			qb.getRawOne.mockResolvedValue(PRODUCT_ROW);
			dataSource.createQueryBuilder.mockReturnValue(qb);

			await service.findOne('product-uuid-1');

			expect(qb.where).toHaveBeenCalledWith('p.id = :id', {
				id: 'product-uuid-1',
			});
		});

		it('also filters out soft-deleted rows via andWhere', async () => {
			const qb = mockSelectQueryBuilder();
			qb.getRawOne.mockResolvedValue(PRODUCT_ROW);
			dataSource.createQueryBuilder.mockReturnValue(qb);

			await service.findOne('product-uuid-1');

			expect(qb.andWhere).toHaveBeenCalledWith('p.deleted_at IS NULL');
		});

		it('throws HttpNotFoundError when product does not exist', async () => {
			const qb = mockSelectQueryBuilder();
			qb.getRawOne.mockResolvedValue(null);
			dataSource.createQueryBuilder.mockReturnValue(qb);

			await expect(service.findOne('non-existent-id')).rejects.toThrow(
				HttpNotFoundError,
			);
		});
	});

	// ─── hide ─────────────────────────────────────────────────────────────────

	describe('hide', () => {
		it('throws HttpNotFoundError when product does not exist', async () => {
			productRepository.findOne.mockResolvedValue(null);

			await expect(service.hide('non-existent-id')).rejects.toThrow(
				HttpNotFoundError,
			);
		});

		it('updates the product status to ARCHIVED when product exists', async () => {
			productRepository.findOne.mockResolvedValue({
				id: 'product-uuid-1',
				status: ProductStatus.ACTIVE,
			});
			productRepository.update.mockResolvedValue(undefined);

			const qb = mockSelectQueryBuilder();
			qb.getRawOne.mockResolvedValue({
				...PRODUCT_ROW,
				status: ProductStatus.ARCHIVED,
			});
			dataSource.createQueryBuilder.mockReturnValue(qb);

			await service.hide('product-uuid-1');

			expect(productRepository.update).toHaveBeenCalledWith('product-uuid-1', {
				status: ProductStatus.ARCHIVED,
			});
		});

		it('returns the updated product row from findOne after archiving', async () => {
			const archivedRow = { ...PRODUCT_ROW, status: ProductStatus.ARCHIVED };
			productRepository.findOne.mockResolvedValue({ id: 'product-uuid-1' });
			productRepository.update.mockResolvedValue(undefined);

			const qb = mockSelectQueryBuilder();
			qb.getRawOne.mockResolvedValue(archivedRow);
			dataSource.createQueryBuilder.mockReturnValue(qb);

			const result = await service.hide('product-uuid-1');

			expect(result).toEqual(archivedRow);
			expect(result.status).toBe(ProductStatus.ARCHIVED);
		});

		it('does not call update when product is not found', async () => {
			productRepository.findOne.mockResolvedValue(null);

			await expect(service.hide('bad-id')).rejects.toThrow(HttpNotFoundError);

			expect(productRepository.update).not.toHaveBeenCalled();
		});

		it('looks up the existing product by id before updating', async () => {
			productRepository.findOne.mockResolvedValue(null);

			await expect(service.hide('product-uuid-1')).rejects.toThrow();

			expect(productRepository.findOne).toHaveBeenCalledWith({
				id: 'product-uuid-1',
			});
		});
	});
});
