import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { CertificationStatus } from '@app/common/enums/certification-status.enum';

const ALLOWED = [
	CertificationStatus.APPROVED,
	CertificationStatus.REJECTED,
] as const;

export class ReviewCertificationRequestDto {
	@ApiProperty({ enum: ALLOWED, description: 'approved or rejected only' })
	@IsEnum(ALLOWED)
	status: CertificationStatus.APPROVED | CertificationStatus.REJECTED;

	@ApiPropertyOptional({
		description: 'Note shown to the user (required when rejecting)',
	})
	@IsOptional()
	@IsString()
	@MaxLength(1000)
	adminNote?: string;
}
