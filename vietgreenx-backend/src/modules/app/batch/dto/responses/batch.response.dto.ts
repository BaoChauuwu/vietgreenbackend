import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { BatchStatus } from '@app/common/enums/batch-status.enum';
import { CropSeasonResponseDto } from '../../../crop-season/dto/responses/crop-season.response.dto';
import { ProductionLogResponseDto } from '../../../production-log/dto/responses/production-log.response.dto';

export class BatchResponseDto {
	@Expose()
	@ApiProperty()
	id: string;

	@Expose()
	@ApiProperty()
	productId: string;

	@Expose()
	@ApiPropertyOptional()
	cropSeasonId?: string;

	@Expose()
	@ApiPropertyOptional()
	greenProfileId?: string;

	@Expose()
	@ApiProperty()
	batchCode: string;

	@Expose()
	@ApiPropertyOptional()
	harvestDate?: string;

	@Expose()
	@ApiProperty()
	quantity: number;

	@Expose()
	@ApiProperty()
	quantityUnit: string;

	@Expose()
	@ApiPropertyOptional()
	qualityStandard?: string;

	@Expose()
	@ApiPropertyOptional()
	qualityNotes?: string;

	@Expose()
	@ApiProperty({ enum: BatchStatus })
	status: BatchStatus;

	@Expose()
	@ApiProperty()
	createdBy: string;

	@Expose()
	@ApiProperty()
	version: number;

	@Expose()
	@ApiProperty()
	createdAt: Date;

	@Expose()
	@ApiProperty()
	updatedAt: Date;

	@Expose()
	@ApiPropertyOptional({ type: () => CropSeasonResponseDto })
	@Type(() => CropSeasonResponseDto)
	cropSeason?: CropSeasonResponseDto;

	@Expose()
	@ApiPropertyOptional({ type: () => [ProductionLogResponseDto] })
	@Type(() => ProductionLogResponseDto)
	productionLogs?: ProductionLogResponseDto[];
}
