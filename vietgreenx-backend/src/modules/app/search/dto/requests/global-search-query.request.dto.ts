import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
	IsEnum,
	IsNotEmpty,
	IsOptional,
	IsString,
	Max,
	Min,
	IsInt,
	MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { SearchType } from '@app/common/enums/search-type.enum';

export class GlobalSearchQueryDto {
	@ApiProperty({
		example: 'vietgreen',
		description: 'Search query keyword',
	})
	@IsNotEmpty()
	@Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
	@IsString()
	@MinLength(2)
	q: string;

	@ApiPropertyOptional({
		enum: SearchType,
		description: 'Filter by specific search type',
	})
	@IsOptional()
	@IsEnum(SearchType)
	type?: SearchType;

	@ApiPropertyOptional({
		description: 'Base64 cursor token for pagination',
	})
	@IsOptional()
	@IsString()
	cursor?: string;

	@ApiPropertyOptional({
		example: 10,
		description: 'Number of items per page',
		minimum: 1,
		maximum: 100,
	})
	@IsOptional()
	@IsInt()
	@Min(1)
	@Max(100)
	@Transform(({ value }) => (value ? Number(value) : 10))
	limit: number = 10;
}
