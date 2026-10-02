import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class GenerateQrRequestDto {
	@ApiProperty({ enum: ['batch', 'product'] })
	@IsIn(['batch', 'product'])
	@IsNotEmpty()
	targetType: string;

	@ApiPropertyOptional()
	@IsOptional()
	@IsUUID()
	batchId?: string;

	@ApiPropertyOptional()
	@IsOptional()
	@IsUUID()
	productId?: string;
}
