import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { ProductPhotoMediaDto } from '../../../product/dto/responses/product.response.dto';

export class ReviewerDto {
	@Expose()
	@ApiProperty()
	id: string;

	@Expose()
	@ApiProperty()
	username: string;

	@Expose()
	@ApiPropertyOptional({ nullable: true })
	displayName: string | null;

	@Expose()
	@ApiPropertyOptional({ nullable: true })
	avatarUrl: string | null;
}

export class ReviewResponseDto {
	@Expose()
	@ApiProperty()
	id: string;

	@Expose()
	@ApiProperty({ example: 5 })
	rating: number;

	@Expose()
	@ApiPropertyOptional({ nullable: true })
	reviewBody: string | null;

	@Expose()
	@ApiProperty({ type: [ProductPhotoMediaDto] })
	@Type(() => ProductPhotoMediaDto)
	photos: ProductPhotoMediaDto[];

	@Expose()
	@ApiProperty()
	createdAt: Date;

	@Expose()
	@ApiProperty({ type: ReviewerDto })
	@Type(() => ReviewerDto)
	reviewer: ReviewerDto;
}

export class ReviewSummaryResponseDto {
	@Expose()
	@ApiProperty({ example: 4.5 })
	avgRating: number;

	@Expose()
	@ApiProperty({ example: 12 })
	reviewCount: number;

	@Expose()
	@ApiProperty({ type: [ReviewResponseDto] })
	@Type(() => ReviewResponseDto)
	items: ReviewResponseDto[];
}
