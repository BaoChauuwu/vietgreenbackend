import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { TradeType } from '@app/common/enums/trade-type.enum';
import { TradeStatus } from '@app/common/enums/trade-status.enum';

export class TradePostPosterDto {
	@Expose()
	@ApiProperty()
	id: string;

	@Expose()
	@ApiProperty()
	username: string;

	@Expose()
	@ApiPropertyOptional()
	displayName: string | null;

	@Expose()
	@ApiPropertyOptional()
	avatarUrl: string | null;
}

export class TradePostCategoryDto {
	@Expose()
	@ApiProperty()
	id: string;

	@Expose()
	@ApiProperty()
	nameEn: string;

	@Expose()
	@ApiProperty()
	nameVi: string;

	@Expose()
	@ApiProperty()
	slug: string;
}

export class TradePostResponseDto {
	@Expose()
	@ApiProperty()
	id: string;

	@Expose()
	@ApiProperty({ enum: TradeType })
	tradeType: TradeType;

	@Expose()
	@ApiProperty({ enum: TradeStatus })
	status: TradeStatus;

	@Expose()
	@ApiProperty()
	title: string;

	@Expose()
	@ApiProperty()
	quantity: number;

	@Expose()
	@ApiProperty()
	quantityUnit: string;

	@Expose()
	@ApiPropertyOptional()
	priceReference: number | null;

	@Expose()
	@ApiPropertyOptional()
	province: string | null;

	@Expose()
	@ApiPropertyOptional({ example: 1, nullable: true })
	provinceCode: number | null;

	@Expose()
	@ApiPropertyOptional({ example: 10, nullable: true })
	districtCode: number | null;

	@Expose()
	@ApiPropertyOptional({ example: 250, nullable: true })
	wardCode: number | null;

	@Expose()
	@ApiPropertyOptional()
	description: string | null;

	@Expose()
	@ApiProperty({ type: [String] })
	photoMediaIds: string[];

	@Expose()
	@ApiProperty({ type: [String] })
	certRequirements: string[];

	@Expose()
	@ApiPropertyOptional()
	deadline: string | null;

	@Expose()
	@ApiProperty()
	listingDays: number;

	@Expose()
	@ApiProperty()
	expiresAt: Date;

	@Expose()
	@ApiProperty()
	interestedCount: number;

	@Expose()
	@ApiProperty()
	viewCount: number;

	@Expose()
	@ApiProperty()
	createdAt: Date;

	@Expose()
	@ApiPropertyOptional({ type: () => TradePostPosterDto })
	@Type(() => TradePostPosterDto)
	poster: TradePostPosterDto | null;

	@Expose()
	@ApiPropertyOptional({ type: () => TradePostCategoryDto })
	@Type(() => TradePostCategoryDto)
	category: TradePostCategoryDto | null;
}
