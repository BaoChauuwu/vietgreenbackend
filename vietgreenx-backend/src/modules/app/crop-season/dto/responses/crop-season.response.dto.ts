import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { SeasonStatus } from '@app/common/enums/season-status.enum';

export class CropSeasonResponseDto {
	@ApiProperty()
	@Expose()
	id: string;

	@ApiProperty()
	@Expose()
	greenProfileId: string;

	@ApiPropertyOptional({ nullable: true })
	@Expose()
	productId: string | null;

	@ApiPropertyOptional({ nullable: true })
	@Expose()
	organizationId: string | null;

	@ApiProperty()
	@Expose()
	createdBy: string;

	@ApiProperty()
	@Expose()
	seasonName: string;

	@ApiProperty()
	@Expose()
	cropType: string;

	@ApiProperty()
	@Expose()
	areaHa: number;

	@ApiProperty()
	@Expose()
	startDate: string;

	@ApiProperty()
	@Expose()
	expectedHarvestDate: string;

	@ApiPropertyOptional({ nullable: true })
	@Expose()
	actualHarvestDate: string | null;

	@ApiProperty({ enum: SeasonStatus })
	@Expose()
	status: SeasonStatus;

	@ApiPropertyOptional({ nullable: true })
	@Expose()
	notes: string | null;

	@ApiProperty()
	@Expose()
	createdAt: Date;

	@ApiProperty()
	@Expose()
	updatedAt: Date;
}
