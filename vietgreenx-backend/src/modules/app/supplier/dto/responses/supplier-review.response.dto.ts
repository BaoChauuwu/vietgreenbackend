import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

export class SupplierReviewerDto {
	@Expose() @ApiProperty() id: string;
	@Expose() @ApiProperty() username: string;
	@Expose() @ApiPropertyOptional({ nullable: true }) displayName: string | null;
	@Expose() @ApiPropertyOptional({ nullable: true }) avatarUrl: string | null;
}

export class SupplierReviewResponseDto {
	@Expose() @ApiProperty() id: string;
	@Expose() @ApiProperty() rating: number;
	@Expose() @ApiPropertyOptional({ nullable: true }) reviewBody: string | null;
	@Expose() @ApiProperty() createdAt: Date;

	@Expose()
	@ApiProperty({ type: SupplierReviewerDto })
	@Type(() => SupplierReviewerDto)
	reviewer: SupplierReviewerDto;
}

export class SupplierReviewSummaryResponseDto {
	@Expose() @ApiProperty() avgRating: number;
	@Expose() @ApiProperty() reviewCount: number;
	@Expose()
	@ApiProperty({ type: [SupplierReviewResponseDto] })
	@Type(() => SupplierReviewResponseDto)
	items: SupplierReviewResponseDto[];
}
