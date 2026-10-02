import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
	ArrayMaxSize,
	IsArray,
	IsIn,
	IsInt,
	IsNotEmpty,
	IsNumber,
	IsOptional,
	IsString,
	IsUUID,
	MaxLength,
	Min,
} from 'class-validator';

export class CreateSellOfferRequestDto {
	@ApiProperty()
	@IsNotEmpty()
	@IsString()
	title: string;

	@ApiProperty()
	@IsNotEmpty()
	@IsUUID()
	categoryId: string;

	@ApiPropertyOptional()
	@IsOptional()
	@IsUUID()
	productId?: string;

	@ApiProperty()
	@IsNumber()
	@Min(0.01)
	quantity: number;

	@ApiProperty()
	@IsNotEmpty()
	@IsString()
	quantityUnit: string;

	@ApiPropertyOptional()
	@IsOptional()
	@IsNumber()
	@Min(1)
	priceReference?: number;

	@ApiPropertyOptional()
	@IsOptional()
	@IsString()
	province?: string;

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

	@ApiPropertyOptional()
	@IsOptional()
	@IsString()
	@MaxLength(2000)
	description?: string;

	@ApiPropertyOptional({ type: [String] })
	@IsOptional()
	@IsArray()
	@IsUUID('all', { each: true })
	@ArrayMaxSize(10)
	photoMediaIds?: string[];

	@ApiPropertyOptional({ enum: [7, 14, 30], default: 14 })
	@IsOptional()
	@IsIn([7, 14, 30])
	listingDays?: number = 14;
}
