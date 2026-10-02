import {
	ClassConstructor,
	ClassTransformOptions,
	plainToInstance,
} from 'class-transformer';
import { Pagination } from '@app/common/types/request-response.type';

export function toDto<T, V>(
	cls: ClassConstructor<T>,
	plain: V,
	options?: ClassTransformOptions,
): T {
	if (!options) {
		options = { strategy: 'excludeAll' };
	}
	return plainToInstance(cls, plain, options);
}

export function toDtos<T, V extends Array<any>>(
	cls: ClassConstructor<T>,
	plain: V,
	options?: ClassTransformOptions,
): T[] {
	if (!options) {
		options = { strategy: 'excludeAll' };
	}
	return plainToInstance(cls, plain, options);
}

export function toPaginateDtos<T, V>(
	cls: ClassConstructor<T>,
	plain: Pagination<V>,
	options?: ClassTransformOptions,
): Pagination<T> {
	if (!options) {
		options = { strategy: 'excludeAll' };
	}

	const { total, page, limit, items, totalPage } = plain;

	return {
		total,
		page,
		limit,
		totalPage,
		items: plainToInstance(cls, items, options),
	};
}
