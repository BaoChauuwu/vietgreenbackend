import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, Max, Min, IsString } from 'class-validator';

export class PaginationDto {
	@ApiProperty({ required: false, example: 1 })
	@IsOptional()
	@IsInt()
	@Transform(({ value }) => (value ? Number(value) : 0))
	page: number = 1;

	@ApiProperty({ required: false, example: 10 })
	@IsOptional()
	@IsInt()
	@Transform(({ value }) => (value ? Number(value) : 10))
	@Max(1000)
	@Min(1)
	limit: number = 10;

	@ApiProperty({ required: false, example: 'created_at' })
	@IsOptional()
	@IsString()
	sortBy?: string;

	@ApiProperty({ required: false, example: 'DESC' })
	@IsOptional()
	@IsString()
	sortOrder?: 'ASC' | 'DESC';
}
