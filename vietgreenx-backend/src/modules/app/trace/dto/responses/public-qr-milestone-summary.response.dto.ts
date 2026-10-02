import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { ActivityType } from '@app/common/enums/activity-type.enum';
import { PublicProductionLogResponseDto } from './public-production-log.response.dto';

export class PublicQrMilestoneSummaryResponseDto {
	@Expose()
	@ApiProperty({
		enum: ActivityType,
		description: 'The primary activity type representing this milestone',
	})
	milestone: ActivityType | string;

	@Expose()
	@ApiProperty({ type: [PublicProductionLogResponseDto] })
	@Type(() => PublicProductionLogResponseDto)
	logs: PublicProductionLogResponseDto[];
}
