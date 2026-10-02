import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class AdminProductDetailResponseDto {
	@ApiProperty()
	@Expose()
	id: string;

	@ApiProperty()
	@Expose()
	name: string;

	@ApiProperty()
	@Expose()
	status: string;

	@ApiPropertyOptional()
	@Expose()
	province: string | null;

	@ApiProperty()
	@Expose()
	categoryId: string;

	@ApiPropertyOptional()
	@Expose()
	categoryNameEn: string | null;

	@ApiPropertyOptional()
	@Expose()
	ownerUserId: string | null;

	@ApiPropertyOptional()
	@Expose()
	ownerUsername: string | null;

	@ApiPropertyOptional()
	@Expose()
	ownerDisplayName: string | null;

	@ApiPropertyOptional()
	@Expose()
	description: string | null;

	@ApiPropertyOptional()
	@Expose()
	productionLocation: string | null;

	@ApiPropertyOptional()
	@Expose()
	priceReference: number | null;

	@ApiPropertyOptional({ type: [String] })
	@Expose()
	photoMediaIds: string[];

	@ApiProperty()
	@Expose()
	hasQr: boolean;

	@ApiProperty()
	@Expose()
	createdAt: Date;

	@ApiProperty()
	@Expose()
	updatedAt: Date;
}
