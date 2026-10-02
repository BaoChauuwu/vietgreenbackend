import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID, IsIn, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ListQrTokensRequestDto {
	@ApiPropertyOptional()
	@IsOptional()
	@IsUUID()
	batchId?: string;

	@ApiPropertyOptional()
	@IsOptional()
	@IsUUID()
	productId?: string;

	@ApiPropertyOptional({ enum: ['batch', 'product'] })
	@IsOptional()
	@IsIn(['batch', 'product'])
	targetType?: string;

	@ApiPropertyOptional({ default: 1 })
	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@Min(1)
	page?: number = 1;

	@ApiPropertyOptional({ default: 20 })
	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@Min(1)
	limit?: number = 20;
}
