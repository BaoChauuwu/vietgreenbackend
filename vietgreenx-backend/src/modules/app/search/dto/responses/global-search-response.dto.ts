import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { UserSearchItemResponseDto } from '../../../user-profile/dto/responses/user-search-item.response.dto';
import { PostResponseDto } from '../../../post/dto/responses/post.response.dto';
import { ProductResponseDto } from '../../../product/dto/responses/product.response.dto';

export class SearchUsersResponseDto {
	@ApiProperty({ type: [UserSearchItemResponseDto] })
	@Expose()
	@Type(() => UserSearchItemResponseDto)
	items: UserSearchItemResponseDto[];

	@ApiPropertyOptional()
	@Expose()
	nextCursor: string | null;

	@ApiProperty()
	@Expose()
	hasNext: boolean;
}

export class SearchPostsResponseDto {
	@ApiProperty({ type: [PostResponseDto] })
	@Expose()
	@Type(() => PostResponseDto)
	items: PostResponseDto[];

	@ApiPropertyOptional()
	@Expose()
	nextCursor: string | null;

	@ApiProperty()
	@Expose()
	hasNext: boolean;
}

export class SearchProductsResponseDto {
	@ApiProperty({ type: [ProductResponseDto] })
	@Expose()
	@Type(() => ProductResponseDto)
	items: ProductResponseDto[];

	@ApiPropertyOptional()
	@Expose()
	nextCursor: string | null;

	@ApiProperty()
	@Expose()
	hasNext: boolean;
}

export class GlobalSearchOverviewResponseDto {
	@ApiProperty({ type: SearchUsersResponseDto })
	@Expose()
	@Type(() => SearchUsersResponseDto)
	users: SearchUsersResponseDto;

	@ApiProperty({ type: SearchPostsResponseDto })
	@Expose()
	@Type(() => SearchPostsResponseDto)
	posts: SearchPostsResponseDto;

	@ApiProperty({ type: SearchProductsResponseDto })
	@Expose()
	@Type(() => SearchProductsResponseDto)
	products: SearchProductsResponseDto;
}
