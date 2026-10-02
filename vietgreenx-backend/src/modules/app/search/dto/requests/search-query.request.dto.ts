import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
	IsEnum,
	IsInt,
	IsNotEmpty,
	IsOptional,
	IsString,
	IsUUID,
	Max,
	MaxLength,
	Min,
	MinLength,
} from 'class-validator';

export enum SearchType {
	USERS = 'users',
	ORGANIZATIONS = 'organizations',
	POSTS = 'posts',
	PRODUCTS = 'products',
}

export class SearchQueryDto {
	@ApiProperty({ minLength: 1, maxLength: 100 })
	@IsNotEmpty()
	@IsString()
	@MinLength(1)
	@MaxLength(100)
	q: string;

	@ApiPropertyOptional({ enum: SearchType })
	@IsOptional()
	@IsEnum(SearchType)
	type?: SearchType;

	@ApiPropertyOptional()
	@IsOptional()
	@IsString()
	province?: string;

	@ApiPropertyOptional()
	@IsOptional()
	@IsUUID()
	categoryId?: string;

	@ApiPropertyOptional({ default: 1 })
	@IsOptional()
	@IsInt()
	@Min(1)
	@Transform(({ value }) => (value ? Number(value) : 1))
	page?: number = 1;

	@ApiPropertyOptional({ default: 20, maximum: 50 })
	@IsOptional()
	@IsInt()
	@Min(1)
	@Max(50)
	@Transform(({ value }) => (value ? Number(value) : 20))
	limit?: number = 20;
}
