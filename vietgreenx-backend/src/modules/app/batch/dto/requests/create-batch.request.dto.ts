import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
	IsDateString,
	IsNotEmpty,
	IsNumber,
	IsOptional,
	IsString,
	IsUUID,
	Min,
} from 'class-validator';

export class CreateBatchRequestDto {
	@ApiProperty({ description: 'The ID of the product' })
	@IsUUID()
	@IsNotEmpty()
	productId: string;

	@ApiProperty({ description: 'The ID of the crop season' })
	@IsUUID()
	@IsNotEmpty()
	cropSeasonId: string;

	@ApiPropertyOptional({
		description: 'Batch code (auto-generated if left empty)',
	})
	@IsString()
	@IsOptional()
	batchCode?: string;

	@ApiPropertyOptional({ description: 'Harvest date (YYYY-MM-DD)' })
	@IsOptional()
	@IsDateString()
	harvestDate?: string;

	@ApiProperty({ description: 'Quantity' })
	@IsNumber()
	@Min(0)
	quantity: number;

	@ApiProperty({ description: 'Unit of the quantity (e.g., kg, ton)' })
	@IsString()
	@IsNotEmpty()
	quantityUnit: string;

	@ApiPropertyOptional({ description: 'Quality standard' })
	@IsOptional()
	@IsString()
	qualityStandard?: string;

	@ApiPropertyOptional({ description: 'Quality notes' })
	@IsOptional()
	@IsString()
	qualityNotes?: string;
}
