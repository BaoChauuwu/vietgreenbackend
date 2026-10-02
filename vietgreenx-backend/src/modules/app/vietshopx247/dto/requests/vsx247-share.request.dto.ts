import {
	IsNotEmpty,
	IsNumber,
	IsOptional,
	IsString,
	IsUrl,
	Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class Vsx247ShareRequestDto {
	@ApiProperty({
		description: 'VietGreenX user ID of the seller posting this share',
	})
	@IsString()
	@IsNotEmpty()
	vgxUserId: string;

	@ApiProperty({ description: 'VietShopX247 internal product ID' })
	@IsString()
	@IsNotEmpty()
	productId: string;

	@ApiProperty()
	@IsString()
	@IsNotEmpty()
	productName: string;

	@ApiPropertyOptional({
		description: 'Product image URL from VietShopX247 CDN',
	})
	@IsUrl()
	@IsOptional()
	productImageUrl?: string;

	@ApiPropertyOptional({ description: 'Product price in VND' })
	@IsNumber()
	@Min(0)
	@IsOptional()
	productPrice?: number;

	@ApiPropertyOptional({ default: 'VND' })
	@IsString()
	@IsOptional()
	priceCurrency?: string;

	@ApiProperty({ description: 'VietShopX247 store name' })
	@IsString()
	@IsNotEmpty()
	storeName: string;

	@ApiProperty({ description: 'VietShopX247 store ID' })
	@IsString()
	@IsNotEmpty()
	storeId: string;

	@ApiProperty({
		description: 'Direct link to the product page on VietShopX247',
	})
	@IsUrl()
	@IsNotEmpty()
	externalUrl: string;

	@ApiPropertyOptional({
		description: 'Product category name from VietShopX247',
	})
	@IsString()
	@IsOptional()
	categoryName?: string;
}
