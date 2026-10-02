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

export class CreateCropSeasonRequestDto {
	@ApiPropertyOptional({ description: 'Product ID' })
	@IsOptional()
	@IsUUID()
	productId?: string;

	@ApiProperty({ description: 'Name of the crop season' })
	@IsString()
	@IsNotEmpty()
	seasonName: string;

	@ApiProperty({ description: 'Type of crop' })
	@IsString()
	@IsNotEmpty()
	cropType: string;

	@ApiProperty({ description: 'Area in hectares (ha)' })
	@IsNumber()
	@Min(0)
	areaHa: number;

	@ApiProperty({ description: 'Start Date (YYYY-MM-DD)' })
	@IsDateString()
	@IsNotEmpty()
	startDate: string;

	@ApiProperty({ description: 'Expected Harvest Date (YYYY-MM-DD)' })
	@IsDateString()
	@IsNotEmpty()
	expectedHarvestDate: string;

	@ApiPropertyOptional({ description: 'Additional notes' })
	@IsOptional()
	@IsString()
	notes?: string;
}
