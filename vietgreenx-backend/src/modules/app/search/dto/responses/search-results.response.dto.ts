import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UserSearchResult {
	@ApiProperty()
	id: string;

	@ApiProperty()
	username: string;

	@ApiPropertyOptional()
	displayName: string | null;

	@ApiPropertyOptional()
	avatarUrl: string | null;

	@ApiPropertyOptional()
	bio: string | null;

	@ApiProperty()
	role: string;
}

export class OrgSearchResult {
	@ApiProperty()
	id: string;

	@ApiProperty()
	slug: string;

	@ApiProperty()
	name: string;

	@ApiPropertyOptional()
	logoUrl: string | null;

	@ApiPropertyOptional()
	description: string | null;

	@ApiPropertyOptional()
	province: string | null;
}

export class PostSearchPosterDto {
	@ApiProperty()
	id: string;

	@ApiProperty()
	username: string;
}

export class PostSearchResult {
	@ApiProperty()
	id: string;

	@ApiPropertyOptional()
	body: string | null;

	@ApiPropertyOptional()
	category: string | null;

	@ApiProperty()
	createdAt: Date;

	@ApiProperty({ type: () => PostSearchPosterDto })
	poster: PostSearchPosterDto;
}

export class ProductSearchCategoryDto {
	@ApiProperty()
	id: string;

	@ApiProperty()
	nameEn: string;
}

export class ProductSearchPosterDto {
	@ApiProperty()
	id: string;

	@ApiProperty()
	username: string;
}

export class ProductSearchResult {
	@ApiProperty()
	id: string;

	@ApiProperty()
	name: string;

	@ApiPropertyOptional()
	description: string | null;

	@ApiProperty()
	status: string;

	@ApiPropertyOptional({ type: () => ProductSearchCategoryDto })
	category: ProductSearchCategoryDto | null;

	@ApiPropertyOptional({ type: () => ProductSearchPosterDto })
	poster: ProductSearchPosterDto | null;
}

export class SearchMetaDto {
	@ApiProperty()
	q: string;

	@ApiPropertyOptional()
	type: string | null;

	@ApiProperty()
	total: number;
}

export class SearchResultsResponseDto {
	@ApiProperty({ type: [UserSearchResult] })
	users: UserSearchResult[];

	@ApiProperty({ type: [OrgSearchResult] })
	organizations: OrgSearchResult[];

	@ApiProperty({ type: [PostSearchResult] })
	posts: PostSearchResult[];

	@ApiProperty({ type: [ProductSearchResult] })
	products: ProductSearchResult[];

	@ApiProperty({ type: () => SearchMetaDto })
	meta: SearchMetaDto;
}
