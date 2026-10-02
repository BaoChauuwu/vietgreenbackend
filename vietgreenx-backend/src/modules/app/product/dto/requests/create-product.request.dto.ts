import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
	ArrayMaxSize,
	IsArray,
	IsBoolean,
	IsDateString,
	IsInt,
	IsNotEmpty,
	IsNumber,
	IsOptional,
	IsString,
	IsUUID,
	Min,
} from 'class-validator';

export class CreateProductRequestDto {
	@ApiProperty({ description: 'The ID of the category' })
	@IsNotEmpty()
	@IsUUID()
	categoryId: string;

	@ApiProperty({ description: 'The name of the product' })
	@IsNotEmpty()
	@IsString()
	name: string;

	@ApiPropertyOptional({ description: 'Detailed description of the product' })
	@IsOptional()
	@IsString()
	description?: string;

	@ApiPropertyOptional({ description: 'Production location address' })
	@IsOptional()
	@IsString()
	productionLocation?: string;

	@ApiPropertyOptional({ description: 'Province code or name' })
	@IsOptional()
	@IsString()
	province?: string;

	@ApiPropertyOptional({ description: 'District code or name' })
	@IsOptional()
	@IsString()
	district?: string;

	@ApiPropertyOptional({
		example: 1,
		description: 'Province code từ provinces.open-api.vn',
	})
	@IsOptional()
	@IsInt()
	@Min(1)
	provinceCode?: number;

	@ApiPropertyOptional({ example: 10 })
	@IsOptional()
	@IsInt()
	@Min(1)
	districtCode?: number;

	@ApiPropertyOptional({ example: 250 })
	@IsOptional()
	@IsInt()
	@Min(1)
	wardCode?: number;

	@ApiPropertyOptional({
		description: 'Estimated or actual harvest date (YYYY-MM-DD)',
	})
	@IsOptional()
	@IsDateString()
	harvestDate?: string;

	@ApiPropertyOptional({ description: 'Reference price' })
	@IsOptional()
	@IsNumber()
	@Min(0)
	priceReference?: number;

	@ApiPropertyOptional({ description: 'Unit of the price (e.g., VND/kg)' })
	@IsOptional()
	@IsString()
	priceUnit?: string;

	@ApiPropertyOptional({ description: 'Available quantity for sale' })
	@IsOptional()
	@IsNumber()
	@Min(0)
	availableQuantity?: number;

	@ApiPropertyOptional({
		description: 'List of quality standards or certifications',
		type: [String],
	})
	@IsOptional()
	@IsArray()
	@IsString({ each: true })
	qualityStandards?: string[];

	@ApiPropertyOptional({
		description: 'List of attached media IDs for photos (max 9)',
		type: [String],
	})
	@IsOptional()
	@IsArray()
	@IsUUID('all', { each: true })
	@ArrayMaxSize(9)
	photoMediaIds?: string[];

	@ApiPropertyOptional({
		description: 'List of linked certification IDs from green profile',
		type: [String],
	})
	@IsOptional()
	@IsArray()
	@IsUUID('all', { each: true })
	certificationIds?: string[];

	@ApiPropertyOptional({
		description: 'Whether the product is listed on the marketplace',
	})
	@IsOptional()
	@IsBoolean()
	isForMarketplace?: boolean;

	@ApiPropertyOptional({
		description: 'Whether the product has QR code traceability enabled',
	})
	@IsOptional()
	@IsBoolean()
	hasQr?: boolean;
}
