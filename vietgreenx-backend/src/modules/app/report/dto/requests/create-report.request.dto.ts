import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { ReportTargetType } from '@app/common/enums/report-target-type.enum';
import { ReportReason } from '@app/common/enums/report-reason.enum';

export class CreateReportRequestDto {
	@ApiProperty({
		description: 'The type of target being reported',
		enum: ReportTargetType,
		example: ReportTargetType.POST,
	})
	@IsNotEmpty()
	@IsEnum(ReportTargetType)
	targetType: ReportTargetType;

	@ApiProperty({
		description: 'The UUID of the target entity (post, comment, user, or product)',
		example: '019eab62-7e34-767a-b81a-98b10f113440',
	})
	@IsNotEmpty()
	@IsUUID()
	targetId: string;

	@ApiProperty({
		description: 'The reason for reporting',
		enum: ReportReason,
		example: ReportReason.SPAM,
	})
	@IsNotEmpty()
	@IsEnum(ReportReason)
	reason: ReportReason;

	@ApiPropertyOptional({
		description: 'Additional details or context about the report',
		example: 'This post contains advertising/spam content.',
	})
	@IsOptional()
	@IsString()
	details?: string;
}
