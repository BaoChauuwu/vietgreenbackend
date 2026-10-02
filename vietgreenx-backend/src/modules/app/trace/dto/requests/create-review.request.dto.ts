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

export class CreateReviewRequestDto {
	@ApiProperty({ example: 5, description: '1–5 star rating' })
	@IsInt()
	@Min(1)
	@Max(5)
	rating: number;

	@ApiPropertyOptional({ example: 'Very fresh produce, great packaging.' })
	@IsOptional()
	@IsString()
	@MaxLength(2000)
	reviewBody?: string;

	@ApiPropertyOptional({
		type: [String],
		description: 'Media IDs for review photos (max 5)',
	})
	@IsOptional()
	@IsArray()
	@IsUUID('all', { each: true })
	photoMediaIds?: string[];
}
