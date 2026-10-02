import { ValueTransformer } from 'typeorm';

/**
 * PostgreSQL returns BIGINT columns as strings.
 * This transformer converts them to/from JavaScript numbers.
 *
 * Usage:
 *   @Column({ name: 'price', type: 'bigint', transformer: bigintTransformer })
 *   price: number;
 */
export const bigintTransformer: ValueTransformer = {
	to: (value: number | null): number | null => value,
	from: (value: string | null): number | null =>
		value !== null ? parseInt(value, 10) : null,
};
