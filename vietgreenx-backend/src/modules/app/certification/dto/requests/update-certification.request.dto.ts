import { IsNullable } from '@app/common/decorators/is-nullable.decorator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { CertificationType } from '@app/common/enums/certification-type.enum';

export class UpdateCertificationRequestDto {
	@ApiPropertyOptional({
		enum: CertificationType,
		description: 'Certification type',
	})
	@IsOptional()
	@IsEnum(CertificationType)
	certType?: CertificationType;

	@ApiPropertyOptional({
		description: 'Certification number. Send null to clear.',
	})
	@IsOptional()
	@IsNullable()
	@IsString()
	certNumber?: string | null;

	@ApiPropertyOptional({ description: 'Issuing authority' })
	@IsOptional()
	@IsString()
	issuingAuthority?: string;

	@ApiPropertyOptional({ description: 'Issue date (YYYY-MM-DD)' })
	@IsOptional()
	@IsDateString()
	issueDate?: string;

	@ApiPropertyOptional({ description: 'Expiry date (YYYY-MM-DD)' })
	@IsOptional()
	@IsDateString()
	expiryDate?: string;

	@ApiPropertyOptional({
		description: 'Storage Key or URL of the uploaded document',
	})
	@IsOptional()
	@IsString()
	documentUrl?: string;
}
