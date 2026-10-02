import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { ActivityType } from '@app/common/enums/activity-type.enum';
import { ProductionLogNoteResponseDto } from './production-log-note.response.dto';

export class CropSeasonSummaryDto {
	@Expose()
	@ApiProperty()
	id: string;

	@Expose()
	@ApiProperty()
	seasonName: string;

	@Expose()
	@ApiProperty()
	cropType: string;

	@Expose()
	@ApiProperty()
	status: string;

	@Expose()
	@ApiProperty()
	startDate: string;

	@Expose()
	@ApiProperty()
	greenProfileId: string;
}

export class ProductionLogMediaDto {
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

export class ProductionLogResponseDto {
	@Expose()
	@ApiProperty()
	id: string;

	@Expose()
	@ApiProperty()
	cropSeasonId: string;

	@Expose()
	@ApiProperty()
	createdBy: string;

	@Expose()
	@ApiProperty()
	logDate: string;

	@Expose()
	@ApiProperty({ enum: ActivityType })
	activityType: ActivityType;

	@Expose()
	@ApiPropertyOptional()
	inputMaterial: string | null;

	@Expose()
	@ApiPropertyOptional()
	dosage: string | null;

	@Expose()
	@ApiPropertyOptional()
	dosageUnit: string | null;

	@Expose()
	@ApiPropertyOptional()
	notes: string | null;

	@Expose()
	@ApiPropertyOptional()
	weather: string | null;

	@Expose()
	@ApiPropertyOptional()
	pestStatus: string | null;

	@Expose()
	@ApiPropertyOptional()
	estimatedYield: number | null;

	@Expose()
	@ApiProperty({ type: [ProductionLogMediaDto] })
	@Type(() => ProductionLogMediaDto)
	medias: ProductionLogMediaDto[];

	@Expose()
	@ApiProperty()
	createdAt: Date;

	@Expose()
	@ApiPropertyOptional({ type: [ProductionLogNoteResponseDto] })
	@Type(() => ProductionLogNoteResponseDto)
	additionalNotes?: ProductionLogNoteResponseDto[];

	@Expose()
	@ApiPropertyOptional({ type: CropSeasonSummaryDto })
	@Type(() => CropSeasonSummaryDto)
	cropSeason?: CropSeasonSummaryDto;
}
