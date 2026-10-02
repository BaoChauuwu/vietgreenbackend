import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReportTargetType } from '@app/common/enums/report-target-type.enum';
import { ReportReason } from '@app/common/enums/report-reason.enum';
import { ReportStatus } from '@app/common/enums/report-status.enum';
import { Expose } from 'class-transformer';

export class CreateReportResponseDto {
	@ApiProperty({ example: '019eab62-7e34-767a-b81a-98b10f113440' })
	@Expose()
	id: string;

	@ApiProperty({ example: '019eab62-7e34-767a-b81a-98b10f113440' })
	@Expose()
	reporterId: string;

	@ApiProperty({
		description: 'The type of target being reported',
		enum: ReportTargetType,
		example: ReportTargetType.POST,
	})
	@Expose()
	targetType: ReportTargetType;

	@ApiProperty({
		description:
			'The UUID of the target entity (post, comment, user, or product)',
		example: '019eab62-7e34-767a-b81a-98b10f113440',
	})
	@Expose()
	targetId: string;

	@ApiProperty({
		description: 'The reason for reporting',
		enum: ReportReason,
		example: ReportReason.SPAM,
	})
	@Expose()
	reason: ReportReason;

	@ApiPropertyOptional({
		description: 'Additional details or context about the report',
		example: 'This post contains advertising/spam content.',
		nullable: true,
	})
	@Expose()
	details: string | null;

	@ApiProperty({
		description: 'The status of the report',
		enum: ReportStatus,
		example: ReportStatus.PENDING,
	})
	@Expose()
	status: ReportStatus;

	@ApiProperty({ example: '2026-06-24T08:46:28.000Z' })
	@Expose()
	createdAt: Date;
}
