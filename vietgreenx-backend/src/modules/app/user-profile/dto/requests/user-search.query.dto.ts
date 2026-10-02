import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
	IsInt,
	IsOptional,
	IsString,
	Max,
	Min,
	MinLength,
} from 'class-validator';

export class UserSearchQueryDto {
	@ApiProperty({
		example: 'hieu',
		description: 'Username prefix or display name fragment (min 2 characters)',
	})
	@IsString()
	@MinLength(2)
	q: string;

	@ApiPropertyOptional({ example: 10, default: 10 })
	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@Min(1)
	@Max(20)
	limit?: number = 10;
}
