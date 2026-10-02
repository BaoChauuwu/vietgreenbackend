// repositories/base.repository.interface.ts
import { Pagination } from '@app/common/types/request-response.type';
import {
	FindOptionsWhere,
	FindManyOptions,
	DeepPartial,
	ObjectLiteral,
	FindOneOptions,
	FindOptionsSelect,
	SelectQueryBuilder, // <--- Imported
} from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity.js';

/**
 * Lightweight partial type for update payloads used in bulkUpdate.
 */
export type QueryPartial<T> = QueryDeepPartialEntity<T>;

/**
 * Cursor pagination result.
 */
export type CursorPage<T> = {
	data: T[];
	nextCursor?: string | null;
	limit: number;
	hasNext: boolean;
};

/**
 * Generic base repository interface
 *
 * Note:
 * - Repository methods DO NOT throw domain exceptions; they return `null`, `false`,
 * or operation-specific values. Let service layer decide to throw.
 */
export interface IBaseRepository<T extends ObjectLiteral> {
	// ========== READ ==========

	/**
	 * Find all entities.
	 * Options include: select, where, order, skip, take, etc.
	 */
	findAll(
		options?: FindManyOptions<T> & { withDeleted?: boolean },
	): Promise<T[]>;

	/**
	 * Find by id primitive (number|string) OR composite where object.
	 * - If primitive is provided, repository will use entity primary column(s).
	 * - If composite PK exists, prefer passing a where object.
	 */
	findById(
		id: number | string | FindOptionsWhere<T>,
		relations?: string[],
		select?: FindOptionsSelect<T>, // <--- Added select
		options?: { withDeleted?: boolean },
	): Promise<T | null>;

	/**
	 * Find one by where, returns null if not found.
	 */
	findOne(
		where: FindOptionsWhere<T>,
		relations?: string[],
		select?: FindOptionsSelect<T>, // <--- Added select
		options?: { withDeleted?: boolean },
	): Promise<T | null>;

	/**
	 * Like findOne but intended to be used when caller expects existence.
	 * Still returns null; service should throw if needed.
	 */
	findOneOrNull(
		where: FindOptionsWhere<T>,
		relations?: string[],
		select?: FindOptionsSelect<T>, // <--- Added select
		options?: { withDeleted?: boolean },
	): Promise<T | null>;

	/**
	 * Find multiple by ids. For composite PKs, pass an array of where objects.
	 */
	findByIds(
		ids: (number | string | FindOptionsWhere<T>)[],
		select?: FindOptionsSelect<T>, // <--- Added select
		options?: { withDeleted?: boolean },
	): Promise<T[]>;

	/**
	 * Find by ids and ensure the result array matches the order of input ids.
	 */
	findByIdsPreserveOrder(
		ids: (number | string)[],
		select?: FindOptionsSelect<T>, // <--- Added select
		options?: { withDeleted?: boolean },
	): Promise<T[]>;

	// ========== WRITE ==========
	create(data: DeepPartial<T>): Promise<T>;
	createMany(data: DeepPartial<T>[]): Promise<T[]>;
	/**
	 * Fast insert (bulk) using repository.insert. Does not trigger entity subscribers / listeners.
	 */
	insertMany(data: DeepPartial<T>[]): Promise<void>;

	/**
	 * Update by id or where object. Returns updated entity or null if not found.
	 */
	update(
		id: number | string | FindOptionsWhere<T>,
		data: DeepPartial<T>,
	): Promise<T | null>;

	/**
	 * Delete by id or where object. Returns true if any rows were affected.
	 */
	delete(id: number | string | FindOptionsWhere<T>): Promise<boolean>;

	/**
	 * Soft delete by id or where. Returns true if any rows affected.
	 */
	softDelete(id: number | string | FindOptionsWhere<T>): Promise<boolean>;

	/**
	 * Restore soft-deleted entity.
	 */
	restore(id: number | string | FindOptionsWhere<T>): Promise<boolean>;

	upsert(
		data: DeepPartial<T>[],
		conflictPaths: (keyof T)[] | string[],
	): Promise<void>;

	/**
	 * Bulk update: returns affected rows count.
	 */
	bulkUpdate(
		where: FindOptionsWhere<T>,
		partial: QueryPartial<T>,
	): Promise<number>;

	// ========== PAGINATION ==========
	/**
	 * Offset-based pagination. Returns enriched metadata (totalPages, hasNext).
	 */
	findWithPagination(
		page: number,
		limit: number,
		options?: FindManyOptions<T> & { withDeleted?: boolean },
	): Promise<Pagination<T>>;

	/**
	 * Cursor-based pagination (seek method). Caller must pass `orderBy` for deterministic results.
	 * Cursor is opaque string (base64) that encodes last-row key(s).
	 */
	paginateWithCursor(
		qb: SelectQueryBuilder<T>,
		cursorKeys: (keyof T & string)[],
		cursor?: string | null,
		limit?: number,
	): Promise<CursorPage<T>>;

	/**
	 * Find one using full FindOneOptions (supports order, relations, selects).
	 * More flexible than findOne() which only accepts where object.
	 */
	findOneByOptions(
		options: FindOneOptions<T> & { withDeleted?: boolean },
	): Promise<T | null>;

	// ========== UTILITY ==========
	count(
		where?: FindOptionsWhere<T> | { withDeleted?: boolean },
	): Promise<number>;
	exists(
		where: FindOptionsWhere<T> | { withDeleted?: boolean },
	): Promise<boolean>;
	existsById(
		id: number | string | FindOptionsWhere<T> | { withDeleted?: boolean },
	): Promise<boolean>;

	// ========== TRANSACTION & RAW HELPERS ==========
	/**
	 * Get a QueryRunner bound to the repository's connection. Caller must release it.
	 */
	getQueryRunner(): Promise<any>;

	/**
	 * Execute work in a transaction using EntityManager.
	 */
	executeInTransaction<R>(operation: (manager: any) => Promise<R>): Promise<R>;
}
