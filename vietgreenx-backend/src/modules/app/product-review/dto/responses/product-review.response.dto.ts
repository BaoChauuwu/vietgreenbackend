import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type, Transform } from 'class-transformer';

export class ReviewerResponseDto {
	@ApiProperty()
	@Expose()
	id: string;

	@ApiProperty()
	@Expose()
	@Transform(({ obj }) => obj.profile?.displayName ?? '')
	displayName: string;

	@ApiProperty({ nullable: true })
	@Expose()
	@Transform(({ obj }) => obj.profile?.avatarMedia?.cdnUrl ?? null)
	avatarUrl: string | null;
}

export class ProductReviewResponseDto {
	@ApiProperty()
	@Expose()
	id: string;

	@ApiProperty()
	@Expose()
	tokenId: string;

	@ApiProperty()
	@Expose()
	reviewerId: string;

	@ApiProperty({ type: ReviewerResponseDto })
	@Expose()
	@Type(() => ReviewerResponseDto)
	reviewer: ReviewerResponseDto;

	@ApiProperty()
	@Expose()
	rating: number;

	@ApiPropertyOptional({ nullable: true })
	@Expose()
	reviewBody: string | null;

	@ApiProperty()
	@Expose()
	isHidden: boolean;

	@ApiProperty()
	@Expose()
	createdAt: Date;
}

