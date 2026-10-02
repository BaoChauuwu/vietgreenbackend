import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CertificationType } from '@app/common/enums/certification-type.enum';
import { CertificationValidityStatus } from '@app/common/enums/certification-validity-status.enum';
import { Expose } from 'class-transformer';

export class TraceCertificationResponseDto {
	@Expose()
	@ApiProperty({
		enum: CertificationType,
		description: 'Type of the certification',
	})
	certType: CertificationType;

	@Expose()
	@ApiPropertyOptional({ description: 'Certificate number' })
	certNumber: string | null;

	@Expose()
	@ApiProperty({ description: 'Issuing authority' })
	issuingAuthority: string;

	@Expose()
	@ApiProperty({ description: 'Issue date (YYYY-MM-DD)' })
	issueDate: string;

	@Expose()
	@ApiProperty({ description: 'Expiry date (YYYY-MM-DD)' })
	expiryDate: string;

	@Expose()
	@ApiProperty({ description: 'URL to the certificate document' })
	documentUrl: string;

	@Expose()
	@ApiProperty({
		description: 'Calculated validity status of the certificate',
		enum: CertificationValidityStatus,
	})
	validityStatus: CertificationValidityStatus;
}
