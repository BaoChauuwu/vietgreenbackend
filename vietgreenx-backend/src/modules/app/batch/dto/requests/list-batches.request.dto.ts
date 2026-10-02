import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';
import { PaginationDto } from '@app/common/dtos/paginationDto';

export class ListBatchesRequestDto extends PaginationDto {
	@ApiPropertyOptional({ description: 'Filter batches by product ID' })
	@IsOptional()
	@IsUUID()
	productId?: string;
}
