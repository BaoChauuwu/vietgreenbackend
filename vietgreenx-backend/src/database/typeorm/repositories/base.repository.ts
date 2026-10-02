import {
	Repository,
	FindOptionsWhere,
	FindManyOptions,
	DeepPartial,
	ObjectLiteral,
	In,
	EntityManager,
	QueryRunner,
	UpdateResult,
	SelectQueryBuilder,
	FindOneOptions,
	FindOptionsSelect,
} from 'typeorm';
import {
	CursorPage,
	IBaseRepository,
} from '../interfaces/base.repository.interface';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity.js';
import { Pagination } from '@app/common/types/request-response.type';
import { HttpBadRequestError } from '@app/common/errors/bad-request.error';
import { ErrorCode } from '@app/common/errors/error-code';

/**
 * Production-ready generic BaseRepository implementation.
 * * Provides standard CRUD operations, transaction handling, and advanced pagination (cursor/offset).
 * Designed to be extended by specific entity repositories.
 */
export abstract class BaseRepository<T extends ObjectLiteral>
	implements IBaseRepository<T>
{
	protected repository: Repository<T>;

	/**
	 * Initializes the repository instance.
	 * @param repository - The TypeORM repository instance injected via dependency injection.
	 */
	constructor(repository: Repository<T>) {
		this.repository = repository;
	}

	/**
	 * Creates a new query builder for the entity, allowing for complex custom queries.
	 * @param alias - Optional alias for the entity in the query.
	 */
	createQueryBuilder(alias?: string): SelectQueryBuilder<T> {
		return this.repository.createQueryBuilder(alias);
	}

	// -----------------------
	// Helper: Primary column metadata
	// -----------------------

	/**
	 * Retrieves the names of the primary key columns for the entity.
	 */
	protected getPrimaryColumnNames(): string[] {
		return this.repository.metadata.primaryColumns.map((c) => c.propertyName);
	}

	/**
	 * Checks if the provided ID is a primitive type (number or string).
	 */
	protected isPrimitiveId(id: unknown): id is number | string {
		return typeof id === 'number' || typeof id === 'string';
	}

	/**
	 * Constructs a WHERE clause for a primary key.
	 * Throws an error if the entity uses composite keys and a primitive ID is passed.
	 */
	protected buildPrimaryWhere(id: number | string): FindOptionsWhere<T> {
		const pk = this.getPrimaryColumnNames();
		if (pk.length === 0)
			throw new Error('Entity has no primary column defined');
		if (pk.length > 1)
			throw new Error(
				'Entity has composite primary key; pass where object instead',
			);
		return { [pk[0]]: id } as unknown as FindOptionsWhere<T>;
	}

	// -----------------------
	// Raw QueryRunner access
	// -----------------------

	/**
	 * Creates and returns a raw QueryRunner.
	 * NOTE: The caller is responsible for releasing the runner (runner.release()).
	 */
	async getQueryRunner(): Promise<QueryRunner> {
		const qr = this.repository.manager.connection.createQueryRunner();
		await qr.connect();
		return qr;
	}

	/**
	 * Executes a callback function within a database transaction.
	 * Uses the repository manager's transaction capability.
	 */
	async executeInTransaction<R>(
		operation: (manager: EntityManager) => Promise<R>,
	): Promise<R> {
		return this.repository.manager.transaction(operation);
	}

	// -----------------------
	// READ Operations
	// -----------------------

	/**
	 * Retrieves all entities matching the given options.
	 * Handles the 'withDeleted' option for soft-deleted records.
	 * Note: 'select' is already part of FindManyOptions.
	 */
	async findAll(
		options?: FindManyOptions<T> & { withDeleted?: boolean },
	): Promise<T[]> {
		if (!options) return this.repository.find();

		const { withDeleted, ...rest } = options;
		const baseOpts = rest as FindManyOptions<T>;

		if (withDeleted) {
			return this.repository.find({
				...baseOpts,
				withDeleted: true,
			} as FindManyOptions<T>);
		}
		return this.repository.find(baseOpts);
	}

	/**
	 * Finds a single entity by its ID.
	 * * @param id - The primary key (primitive) or a WHERE condition object.
	 * @param relations - Array of related entities to load (e.g., ['profile', 'roles']).
	 * @param select - Specific columns to retrieve (improves performance).
	 * @param options - Additional options like 'withDeleted'.
	 */
	async findById(
		id: number | string | FindOptionsWhere<T>,
		relations: string[] = [],
		select?: FindOptionsSelect<T>, // <--- Added select
		options?: { withDeleted?: boolean },
	): Promise<T | null> {
		const whereClause: FindOptionsWhere<T> = this.isPrimitiveId(id)
			? this.buildPrimaryWhere(id)
			: id;
		const { withDeleted } = options || {};

		const findOpts: FindOneOptions<T> & { withDeleted?: boolean } = {
			where: whereClause,
			relations,
			select, // <--- Mapped
		};

		if (withDeleted) findOpts.withDeleted = true;

		return this.repository.findOne(findOpts as FindOneOptions<T>);
	}

	/**
	 * Finds a single entity matching the specified criteria.
	 * * @param where - Conditions to match.
	 * @param relations - Relations to load.
	 * @param select - Columns to select.
	 */
	async findOne(
		where: FindOptionsWhere<T>,
		relations: string[] = [],
		select?: FindOptionsSelect<T>, // <--- Added select
		options?: { withDeleted?: boolean },
	): Promise<T | null> {
		const { withDeleted } = options || {};
		const findOpts: FindOneOptions<T> & { withDeleted?: boolean } = {
			where,
			relations,
			select, // <--- Mapped
		};

		if (withDeleted) findOpts.withDeleted = true;

		return this.repository.findOne(findOpts as FindOneOptions<T>);
	}

	/**
	 * Alias for findOne to explicitly indicate it returns null if not found.
	 */
	async findOneOrNull(
		where: FindOptionsWhere<T>,
		relations: string[] = [],
		select?: FindOptionsSelect<T>, // <--- Added select
		options?: { withDeleted?: boolean },
	): Promise<T | null> {
		return this.findOne(where, relations, select, options);
	}

	/**
	 * Finds multiple entities by a list of IDs.
	 * Supports both primitive ID arrays (using SQL IN) and composite key arrays.
	 */
	async findByIds(
		ids: (number | string | FindOptionsWhere<T>)[],
		select?: FindOptionsSelect<T>, // <--- Added select
		options?: { withDeleted?: boolean },
	): Promise<T[]> {
		const pks = this.getPrimaryColumnNames();
		const { withDeleted } = options || {};

		// Optimization: If single PK and all IDs are primitives, use "IN (...)"
		if (pks.length === 1 && ids.every((i) => this.isPrimitiveId(i))) {
			const whereObj = {
				[pks[0]]: In(ids),
			} as unknown as FindOptionsWhere<T>;
			const findOpts: FindManyOptions<T> & { withDeleted?: boolean } = {
				where: whereObj,
				select, // <--- Mapped
			};
			if (withDeleted) findOpts.withDeleted = true;
			return this.repository.find(findOpts as FindManyOptions<T>);
		}

		// Fallback: Handle composite keys or mixed types
		const whereList = ids as FindOptionsWhere<T>[];
		const findOpts: FindManyOptions<T> & { withDeleted?: boolean } = {
			where: whereList,
			select, // <--- Mapped
		};
		if (withDeleted) findOpts.withDeleted = true;
		return this.repository.find(findOpts as FindManyOptions<T>);
	}

	/**
	 * Finds entities by IDs and sorts them to match the order of the input IDs.
	 * Useful when the order of results matters (e.g., UI display).
	 */
	async findByIdsPreserveOrder(
		ids: (number | string)[],
		select?: FindOptionsSelect<T>, // <--- Added select
		options?: { withDeleted?: boolean },
	): Promise<T[]> {
		const pks = this.getPrimaryColumnNames();
		if (pks.length !== 1)
			throw new Error(
				'findByIdsPreserveOrder only supported for single PK entities',
			);
		if (ids.length === 0) return [];

		// Fetch data first (Database order is not guaranteed)
		// Pass select to findByIds
		const rows = await this.findByIds(ids, select, options);

		const keyName = pks[0];
		const map = new Map<string | number, T>();

		// Map results by ID for quick lookup
		rows.forEach((r) => {
			const rRecord = r as unknown as Record<string, unknown>;
			const keyValue = rRecord[keyName];
			if (typeof keyValue === 'string' || typeof keyValue === 'number') {
				map.set(keyValue, r);
			}
		});

		// Reconstruct the array based on the input 'ids' order
		const result = ids
			.map((id) => map.get(id))
			.filter((item): item is T => item !== undefined && item !== null);
		return result;
	}

	// -----------------------
	// WRITE Operations (Create / Update / Delete)
	// -----------------------

	/**
	 * Creates and saves a single entity.
	 * Triggers TypeORM lifecycle hooks (BeforeInsert, AfterInsert, etc.).
	 */
	async create(data: DeepPartial<T>): Promise<T> {
		const entity = this.repository.create(data);
		return this.repository.save(entity as DeepPartial<T>);
	}

	/**
	 * Creates and saves multiple entities.
	 * Triggers lifecycle hooks.
	 */
	async createMany(data: DeepPartial<T>[]): Promise<T[]> {
		const entities = this.repository.create(data);
		return this.repository.save(entities as DeepPartial<T>[]);
	}

	/**
	 * Fast bulk insert using raw SQL.
	 * WARNING: Does NOT trigger TypeORM lifecycle hooks or cascading.
	 */
	async insertMany(data: DeepPartial<T>[]): Promise<void> {
		if (!Array.isArray(data) || data.length === 0) return;
		await this.repository.insert(data as QueryDeepPartialEntity<T>[]);
	}

	/**
	 * Updates an entity by ID.
	 * First fetches the entity, updates properties, then saves.
	 * Triggers lifecycle hooks.
	 */
	async update(
		id: number | string | FindOptionsWhere<T>,
		data: DeepPartial<T>,
	): Promise<T | null> {
		const where = this.isPrimitiveId(id) ? this.buildPrimaryWhere(id) : id;
		const entity = await this.repository.findOne({
			where,
		} as FindOneOptions<T>);
		if (!entity) return null;
		Object.assign(entity, data);
		return this.repository.save(entity as DeepPartial<T>);
	}

	/**
	 * Deletes a record from the database.
	 * Returns true if a record was actually deleted (affected > 0).
	 */
	async delete(id: number | string | FindOptionsWhere<T>): Promise<boolean> {
		const where = this.isPrimitiveId(id) ? this.buildPrimaryWhere(id) : id;
		const result = await this.repository.delete(where);
		return (result.affected ?? 0) > 0;
	}

	/**
	 * Soft deletes a record (sets deleted_at timestamp).
	 * Requires @DeleteDateColumn in the entity.
	 */
	async softDelete(
		id: number | string | FindOptionsWhere<T>,
	): Promise<boolean> {
		const where = this.isPrimitiveId(id) ? this.buildPrimaryWhere(id) : id;
		const result = await this.repository.softDelete(where);
		return (result.affected ?? 0) > 0;
	}

	/**
	 * Restores a soft-deleted record.
	 */
	async restore(id: number | string | FindOptionsWhere<T>): Promise<boolean> {
		const where = this.isPrimitiveId(id) ? this.buildPrimaryWhere(id) : id;
		const result = await this.repository.restore(where);
		return (result.affected ?? 0) > 0;
	}

	/**
	 * Performs an UPSERT operation (Insert or Update on conflict).
	 * @param conflictPaths - The columns to check for uniqueness violation (e.g., ['id'] or ['email']).
	 */
	async upsert(
		data: DeepPartial<T>[],
		conflictPaths: (keyof T)[] | string[],
	): Promise<void> {
		if (!Array.isArray(data) || data.length === 0) return;
		const payload = data as QueryDeepPartialEntity<T>[];
		const conflicts = conflictPaths as string[];
		await this.repository.upsert(payload, conflicts);
	}

	/**
	 * Performs a bulk update using QueryBuilder.
	 * Efficient for updating many rows at once based on a criteria.
	 * Does NOT load entities into memory.
	 */
	async bulkUpdate(
		where: FindOptionsWhere<T>,
		partial: QueryDeepPartialEntity<T>,
	): Promise<number> {
		const qb = this.repository
			.createQueryBuilder()
			.update()
			.set(partial)
			.where(where);
		const res: UpdateResult = await qb.execute();
		return res.affected ?? 0;
	}

	// -----------------------
	// PAGINATION
	// -----------------------

	/**
	 * Standard offset-based pagination.
	 * Useful for UI grids with page numbers.
	 * * @param page - Page number (1-based).
	 * @param limit - Number of items per page.
	 */
	async findWithPagination(
		page: number = 1,
		limit: number = 20,
		options?: FindManyOptions<T> & { withDeleted?: boolean },
	): Promise<Pagination<T>> {
		page = Math.max(1, Math.floor(page));
		limit = Math.max(1, Math.min(Math.floor(limit), 1000));
		const skip = (page - 1) * limit;

		if (!options) {
			const [data, total] = await this.repository.findAndCount({
				skip,
				take: limit,
			});
			const totalPages = limit > 0 ? Math.ceil(total / limit) : 0;
			return {
				page,
				limit,
				total,
				totalPage: totalPages,
				items: data,
			};
		}

		const { withDeleted, ...rest } = options;
		const findOpts = {
			skip,
			take: limit,
			...(rest as FindManyOptions<T>),
		} as FindManyOptions<T>;
		if (withDeleted) (findOpts as any).withDeleted = true;

		const [data, total] = await this.repository.findAndCount(findOpts);
		const totalPages = limit > 0 ? Math.ceil(total / limit) : 0;
		return { page, limit, total, totalPage: totalPages, items: data };
	}

	/**
	 * Cursor-based pagination (Seek Method).
	 * High performance for infinite scrolling or large datasets.
	 * Avoids OFFSET slowness by using WHERE conditions on indexed columns.
	 *
	 * @param qb - Pre-built SelectQueryBuilder with joins, filters, and orderBy already applied.
	 * @param cursorKeys - Entity field names used to extract cursor values, must match orderBy column order (e.g. ['createdAt', 'id']).
	 * @param cursor - Base64 encoded string containing the last seen values. Omit or pass null for the first page.
	 * @param limit - Number of items per page (default: 20, max: 1000).
	 */
	async paginateWithCursor(
		qb: SelectQueryBuilder<T>,
		cursorKeys: (keyof T & string)[],
		cursor?: string | null,
		limit: number = 20,
	): Promise<CursorPage<T>> {
		const orderBys = qb.expressionMap.orderBys;

		if (Object.keys(orderBys).length === 0) {
			throw new Error(
				'QueryBuilder must have at least one orderBy for cursor pagination',
			);
		}

		const orderEntries: [string, 'ASC' | 'DESC'][] = Object.entries(
			orderBys,
		).map(([col, val]) => [col, typeof val === 'string' ? val : val.order]);

		if (cursorKeys.length !== orderEntries.length) {
			throw new Error(
				`cursorKeys length (${cursorKeys.length}) must match number of orderBy columns (${orderEntries.length})`,
			);
		}

		limit = Math.max(1, Math.min(Math.floor(limit), 1000));

		if (cursor) {
			try {
				type CursorPayload = { values: unknown[] };
				const raw = Buffer.from(cursor, 'base64').toString('utf8');
				const parsed: unknown = JSON.parse(raw);

				const isValidCursor = (obj: unknown): obj is CursorPayload =>
					typeof obj === 'object' &&
					obj !== null &&
					Array.isArray((obj as Record<string, unknown>).values);

				if (!isValidCursor(parsed)) throw new Error('shape');
				const values = parsed.values;

				if (values.length !== orderEntries.length) {
					throw new Error('length');
				}

				const seekParts: string[] = [];
				const params: Record<string, unknown> = {};

				for (let i = 0; i < orderEntries.length; i++) {
					const andParts: string[] = [];

					for (let j = 0; j < i; j++) {
						andParts.push(`${orderEntries[j][0]} = :c_${j}`);
						params[`c_${j}`] = values[j];
					}

					const [col, dir] = orderEntries[i];
					const op = dir === 'ASC' ? '>' : '<';
					andParts.push(`${col} ${op} :c_${i}`);
					params[`c_${i}`] = values[i];

					seekParts.push(`(${andParts.join(' AND ')})`);
				}

				qb = qb.andWhere(`(${seekParts.join(' OR ')})`, params);
			} catch {
				throw new HttpBadRequestError(ErrorCode.INVALID_CURSOR);
			}
		}

		qb = qb.take(limit + 1);

		const rows = await qb.getMany();
		const hasNext = rows.length > limit;
		const pageData = hasNext ? rows.slice(0, limit) : rows;

		let nextCursor: string | null = null;
		if (hasNext && pageData.length > 0) {
			const last = pageData[pageData.length - 1] as unknown as Record<
				string,
				unknown
			>;
			const lastValues = cursorKeys.map((key) => last[key]);
			nextCursor = Buffer.from(JSON.stringify({ values: lastValues })).toString(
				'base64',
			);
		}

		return { data: pageData, nextCursor, limit, hasNext };
	}

	// -----------------------
	// UTILITY METHODS
	// -----------------------

	/**
	 * Counts entities matching the condition.
	 */
	async count(
		where?: FindOptionsWhere<T> | { withDeleted?: boolean },
	): Promise<number> {
		if (where && typeof where === 'object' && 'withDeleted' in where) {
			const obj = where as { withDeleted?: boolean } & FindOptionsWhere<T>;
			const { withDeleted, ...rest } = obj;
			return this.repository.count({
				where: rest as FindOptionsWhere<T>,
				withDeleted,
			});
		}
		return this.repository.count({
			where: where as FindOptionsWhere<T> | undefined,
		});
	}

	/**
	 * Helper to check if "withDeleted" is present in options.
	 */
	private hasWithDeletedOption(
		obj: unknown,
	): obj is { withDeleted: boolean } & FindOptionsWhere<T> {
		return (
			typeof obj === 'object' &&
			obj !== null &&
			'withDeleted' in obj &&
			typeof (obj as any).withDeleted === 'boolean'
		);
	}

	/**
	 * Checks if any entity exists matching the criteria.
	 */
	async exists(
		where: FindOptionsWhere<T> | { withDeleted?: boolean },
	): Promise<boolean> {
		if (this.hasWithDeletedOption(where)) {
			const { withDeleted, ...rest } = where;
			const cnt = await this.count({
				...(rest as FindOptionsWhere<T>),
				withDeleted,
			});
			return cnt > 0;
		}

		// Pure where object
		const count = await this.count(where as FindOptionsWhere<T>);
		return count > 0;
	}

	/**
	 * Checks existence by ID.
	 */
	async existsById(
		id: number | string | FindOptionsWhere<T> | { withDeleted?: boolean },
	): Promise<boolean> {
		if (this.hasWithDeletedOption(id)) {
			const { withDeleted, ...rest } = id;
			const cnt = await this.count({
				...(rest as FindOptionsWhere<T>),
				withDeleted,
			});
			return cnt > 0;
		}

		if (this.isPrimitiveId(id)) {
			const where = this.buildPrimaryWhere(id);
			return this.exists(where);
		}

		return this.exists(id as FindOptionsWhere<T>);
	}

	/**
	 * Generic find one using full FindOneOptions.
	 * Useful when you need complete control over TypeORM options.
	 */
	async findOneByOptions(
		options: FindOneOptions<T> & { withDeleted?: boolean },
	): Promise<T | null> {
		const { withDeleted, ...rest } = options;
		if (withDeleted) {
			return this.repository.findOne({
				...(rest as FindOneOptions<T>),
				withDeleted: true,
			} as FindOneOptions<T>);
		}
		return this.repository.findOne(rest as FindOneOptions<T>);
	}
}
