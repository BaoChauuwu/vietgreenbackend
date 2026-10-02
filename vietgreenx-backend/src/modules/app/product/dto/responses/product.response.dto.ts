import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { ProductStatus } from '@app/common/enums/product-status.enum';

export class ProductPhotoMediaDto {
	@Expose()
	@ApiProperty()
	id: string;

	@Expose()
	@ApiProperty()
	cdnUrl: string;

	@Expose()
	@ApiProperty()
	mimeType: string;
}

export class ProductResponseDto {
	@Expose()
	@ApiProperty()
	id: string;

	@Expose()
	@ApiPropertyOptional()
	ownerUserId: string | null;

	@Expose()
	@ApiPropertyOptional()
	organizationId: string | null;

	@Expose()
	@ApiPropertyOptional()
	greenProfileId: string | null;

	@Expose()
	@ApiProperty()
	categoryId: string;

	@Expose()
	@ApiProperty()
	name: string;

	@Expose()
	@ApiPropertyOptional()
	slug: string | null;

	@Expose()
	@ApiPropertyOptional()
	description: string | null;

	@Expose()
	@ApiPropertyOptional()
	productionLocation: string | null;

	@Expose()
	@ApiPropertyOptional()
	province: string | null;

	@Expose()
	@ApiPropertyOptional()
	district: string | null;

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
	harvestDate: string | null;

	@Expose()
	@ApiPropertyOptional()
	priceReference: number | null;

	@Expose()
	@ApiPropertyOptional()
	priceUnit: string | null;

	@Expose()
	@ApiPropertyOptional()
	availableQuantity: number | null;

	@Expose()
	@ApiProperty()
	qualityStandards: string[];

	@Expose()
	@ApiProperty()
	photoMediaIds: string[];

	@Expose()
	@ApiPropertyOptional({ type: [ProductPhotoMediaDto] })
	@Type(() => ProductPhotoMediaDto)
	photoMedias?: ProductPhotoMediaDto[];

	@Expose()
	@ApiPropertyOptional()
	certificationIds?: string[];

	@Expose()
	@ApiProperty({ enum: ProductStatus })
	status: ProductStatus;

	@Expose()
	@ApiProperty()
	isForMarketplace: boolean;

	@Expose()
	@ApiProperty()
	hasQr: boolean;

	@Expose()
	@ApiProperty()
	viewCount: number;

	@Expose()
	@ApiProperty()
	version: number;

	@Expose()
	@ApiProperty()
	createdAt: Date;

	@Expose()
	@ApiProperty()
	updatedAt: Date;
}
