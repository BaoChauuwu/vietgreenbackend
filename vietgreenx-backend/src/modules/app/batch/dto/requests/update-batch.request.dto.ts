import { ApiPropertyOptional } from '@nestjs/swagger';
import {
	IsDateString,
	IsEnum,
	IsNumber,
	IsOptional,
	IsString,
	Min,
} from 'class-validator';
import { BatchStatus } from '@app/common/enums/batch-status.enum';

export class UpdateBatchRequestDto {
	@ApiPropertyOptional({ description: 'Batch code' })
	@IsOptional()
	@IsString()
	batchCode?: string;

	@ApiPropertyOptional({ description: 'Harvest date (YYYY-MM-DD)' })
	@IsOptional()
	@IsDateString()
	harvestDate?: string;

	@ApiPropertyOptional({ description: 'Quantity' })
	@IsOptional()
	@IsNumber()
	@Min(0)
	quantity?: number;

	@ApiPropertyOptional({ description: 'Unit of the quantity' })
	@IsOptional()
	@IsString()
	quantityUnit?: string;

	@ApiPropertyOptional({ description: 'Quality standard' })
	@IsOptional()
	@IsString()
	qualityStandard?: string;

	@ApiPropertyOptional({ description: 'Quality notes' })
	@IsOptional()
	@IsString()
	qualityNotes?: string;

	@ApiPropertyOptional({
		description: 'Batch status',
		enum: BatchStatus,
	})
	@IsOptional()
	@IsEnum(BatchStatus)
	status?: BatchStatus;
}
