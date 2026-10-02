import { Expose } from 'class-transformer';

export class PaginationResponseDto<T> {
	@Expose()
	page: number;

	@Expose()
	limit: number;

	@Expose()
	total: number;

	@Expose()
	totalPage: number;

	@Expose()
	items: T[];
}
