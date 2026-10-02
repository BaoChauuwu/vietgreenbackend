import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
	IsInt,
	IsNotEmpty,
	IsOptional,
	IsString,
	Max,
	MaxLength,
	Min,
	MinLength,
} from 'class-validator';
import { HASHTAG_MAX_LENGTH } from '../../utils/parse-post-hashtags';

export class HashtagSearchQueryDto {
	@ApiProperty({ example: 'cap', minLength: 1 })
	@IsString()
	@IsNotEmpty()
	@MinLength(1)
	@MaxLength(HASHTAG_MAX_LENGTH)
	q: string;

	@ApiPropertyOptional({ default: 10, maximum: 20 })
	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@Min(1)
	@Max(20)
	limit?: number = 10;
}
