import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export enum ScanGranularity {
	DAY = 'day',
	WEEK = 'week',
	MONTH = 'month',
}

export class QrScanTimeseriesQueryDto {
	@ApiPropertyOptional({ enum: ScanGranularity, default: ScanGranularity.DAY })
	@IsOptional()
	@IsEnum(ScanGranularity)
	granularity?: ScanGranularity = ScanGranularity.DAY;

	@ApiPropertyOptional({
		description: 'Number of days to look back',
		default: 30,
	})
	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@Min(1)
	@Max(365)
	days?: number = 30;
}
