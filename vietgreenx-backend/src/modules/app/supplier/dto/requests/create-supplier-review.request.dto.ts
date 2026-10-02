import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
	IsArray,
	IsInt,
	IsOptional,
	IsString,
	IsUUID,
	Max,
	MaxLength,
	Min,
} from 'class-validator';

export class CreateSupplierReviewRequestDto {
	@ApiProperty({ description: 'Rating from 1 to 5', example: 5 })
	@IsInt()
	@Min(1)
	@Max(5)
	rating: number;

	@ApiPropertyOptional({
		description: 'Review text',
		example: 'Hàng chất lượng, giao đúng hẹn',
	})
	@IsOptional()
	@IsString()
	@MaxLength(2000)
	reviewBody?: string;

	@ApiPropertyOptional({
		description: 'Completed order ID to verify the transaction',
	})
	@IsOptional()
	@IsUUID()
	orderId?: string;

	@ApiPropertyOptional({
		type: [String],
		description: 'Media IDs for review photos (max 5)',
	})
	@IsOptional()
	@IsArray()
	@IsUUID('all', { each: true })
	photoMediaIds?: string[];
}
