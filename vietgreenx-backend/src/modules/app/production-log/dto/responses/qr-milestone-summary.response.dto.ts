import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { ProductionLogResponseDto } from './production-log.response.dto';
import { ActivityType } from '@app/common/enums/activity-type.enum';

export class QrMilestoneSummaryResponseDto {
	@Expose()
	@ApiProperty({
		enum: ActivityType,
		description: 'The primary activity type representing this milestone',
	})
	milestone: ActivityType | string;

	@Expose()
	@ApiProperty({ type: [ProductionLogResponseDto] })
	@Type(() => ProductionLogResponseDto)
	logs: ProductionLogResponseDto[];
}
