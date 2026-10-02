import { TableColumnOptions } from 'typeorm';

export const columnId: TableColumnOptions = {
	name: 'id',
	type: 'uuid',
	isPrimary: true,
	generationStrategy: 'uuid',
	default: `uuid_generate_v4()`,
};

export const columnCreatedAt: TableColumnOptions = {
	name: 'created_at',
	type: 'timestamptz',
	default: 'now()',
};

export const columnUpdatedAt: TableColumnOptions = {
	name: 'updated_at',
	type: 'timestamptz',
	default: 'now()',
};

export const columnDeletedAt: TableColumnOptions = {
	name: 'deleted_at',
	type: 'timestamptz',
	isNullable: true,
};

export const columnBigSerialId: TableColumnOptions = {
	name: 'id',
	type: 'bigint',
	isPrimary: true,
	isGenerated: true,
	generationStrategy: 'increment',
};
