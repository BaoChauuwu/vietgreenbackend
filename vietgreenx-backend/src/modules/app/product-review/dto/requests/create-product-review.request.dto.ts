import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, Max, Min, Length } from 'class-validator';

export class CreateProductReviewRequestDto {
	@ApiProperty({
		example: 5,
		description: 'Product rating from 1 to 5 stars',
		minimum: 1,
		maximum: 5,
	})
	@IsNotEmpty()
	@IsInt()
	@Min(1)
	@Max(5)
	rating: number;

	@ApiPropertyOptional({
		example: 'Great quality, highly recommend!',
		description: 'Detailed text review for the product',
	})
	@IsOptional()
	@IsString()
	@Length(1, 1000)
	reviewBody?: string;
}
