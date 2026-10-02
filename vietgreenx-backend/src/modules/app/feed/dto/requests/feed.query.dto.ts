import { FeedMode } from '@app/common/enums/feed-mode.enum';
import { PostCategory } from '@app/common/enums/post-category.enum';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class FeedQueryDto {
	@ApiPropertyOptional({
		example: FeedMode.DISCOVERY,
		enum: FeedMode,
		description: 'Feed mode: discovery (public posts) or following',
		default: FeedMode.DISCOVERY,
	})
	@IsOptional()
	@IsEnum(FeedMode)
	mode?: FeedMode;

	@ApiPropertyOptional({
		example: 20,
		description: 'Number of posts per page',
		default: 20,
	})
	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@Min(1)
	@Max(50)
	limit?: number;

	@ApiPropertyOptional({
		description: 'Cursor from previous response nextCursor',
	})
	@IsOptional()
	@IsString()
	cursor?: string;

	@ApiPropertyOptional({
		enum: PostCategory,
		description: 'Filter by category',
	})
	@IsOptional()
	@IsEnum(PostCategory)
	category?: PostCategory;

	@ApiPropertyOptional({
		description:
			'Full-text search query. When present, mode/cursor/category are ignored — searches all public posts + own posts by body text.',
		example: 'xoài cát hòa lộc',
	})
	@IsOptional()
	@IsString()
	q?: string;
}
