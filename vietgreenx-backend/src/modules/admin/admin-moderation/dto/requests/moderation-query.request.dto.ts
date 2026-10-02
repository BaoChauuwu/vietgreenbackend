import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '@app/common/dtos/paginationDto';
import { ReportStatus } from '@app/common/enums/report-status.enum';
import { ReportReason } from '@app/common/enums/report-reason.enum';

export class ModerationQueryRequestDto extends PaginationDto {
	@ApiPropertyOptional({ enum: ReportStatus })
	@IsOptional()
	@IsEnum(ReportStatus)
	status?: ReportStatus;

	@ApiPropertyOptional()
	@IsOptional()
	@IsString()
	targetType?: string;

	@ApiPropertyOptional({ enum: ReportReason })
	@IsOptional()
	@IsEnum(ReportReason)
	reason?: ReportReason;
}
