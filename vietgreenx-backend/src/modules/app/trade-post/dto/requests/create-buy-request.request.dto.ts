import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
	ArrayMaxSize,
	IsArray,
	IsDateString,
	IsInt,
	IsNotEmpty,
	IsNumber,
	IsOptional,
	IsString,
	IsUUID,
	MaxLength,
	Min,
} from 'class-validator';

export class CreateBuyRequestDto {
	@ApiProperty()
	@IsNotEmpty()
	@IsString()
	title: string;

	@ApiProperty()
	@IsNotEmpty()
	@IsUUID()
	categoryId: string;

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
	@IsString({ each: true })
	@ArrayMaxSize(5)
	certRequirements?: string[];

	@ApiPropertyOptional()
	@IsOptional()
	@IsDateString()
	deadline?: string;
}
