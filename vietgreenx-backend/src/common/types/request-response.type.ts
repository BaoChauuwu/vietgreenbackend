export type PaginationParams = {
	page: number;
	limit: number;
};

export type PaginationData<T> = {
	total: number;
	totalPage: number;
	items: T[];
};

export type Pagination<T> = PaginationParams & PaginationData<T>;
