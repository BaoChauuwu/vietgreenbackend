import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
	IsInt,
	IsNotEmpty,
	IsNumber,
	IsOptional,
	IsPositive,
	IsString,
	IsUUID,
	MaxLength,
	Min,
} from 'class-validator';

export class CreateQuotationRequestDto {
	@ApiPropertyOptional({
		description:
			'Trade post this quotation is linked to (optional — can be direct to a seller)',
	})
	@IsOptional()
	@IsUUID()
	tradePostId?: string;

	@ApiProperty({ description: 'Receiver (seller) user ID' })
	@IsUUID()
	receiverUserId: string;

	@ApiPropertyOptional({ description: 'Specific product ID (optional)' })
	@IsOptional()
	@IsUUID()
	productId?: string;

	@ApiProperty({ description: 'Offered price in VND', example: 15000 })
	@IsInt()
	@Min(0)
	offeredPrice: number;

	@ApiProperty({ description: 'Price unit', example: 'VND/kg' })
	@IsString()
	@IsNotEmpty()
	@MaxLength(50)
	priceUnit: string;

	@ApiProperty({ description: 'Quantity', example: 100 })
	@IsNumber()
	@IsPositive()
	quantity: number;

	@ApiProperty({ description: 'Quantity unit', example: 'kg' })
	@IsString()
	@IsNotEmpty()
	@MaxLength(50)
	quantityUnit: string;

	@ApiPropertyOptional({
		description: 'Delivery terms',
		example: 'Giao tại kho người mua, Q.1 TP.HCM',
	})
	@IsOptional()
	@IsString()
	@MaxLength(500)
	deliveryTerms?: string;

	@ApiPropertyOptional({
		description: 'Additional notes',
		example: 'Cần hàng trước 15/09',
	})
	@IsOptional()
	@IsString()
	@MaxLength(1000)
	notes?: string;
}
