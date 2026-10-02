import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { CertificationType } from '@app/common/enums/certification-type.enum';
import { CertificationStatus } from '@app/common/enums/certification-status.enum';

export class CertificationResponseDto {
	@ApiProperty()
	@Expose()
	id: string;

	@ApiProperty()
	@Expose()
	greenProfileId: string;

	@ApiProperty({ enum: CertificationType })
	@Expose()
	certType: CertificationType;

	@ApiPropertyOptional()
	@Expose()
	certNumber: string | null;

	@ApiProperty()
	@Expose()
	issuingAuthority: string;

	@ApiProperty()
	@Expose()
	issueDate: string;

	@ApiProperty()
	@Expose()
	expiryDate: string;

	@ApiProperty({
		description: 'Signed URL to access the certification document (temporary)',
	})
	@Expose()
	documentUrl: string;

	@ApiProperty({ enum: CertificationStatus })
	@Expose()
	status: CertificationStatus;

	@ApiPropertyOptional({
		nullable: true,
		description: 'Reason when admin rejects the certificate',
	})
	@Expose()
	adminNote: string | null;

	@ApiProperty()
	@Expose()
	createdAt: Date;

	@ApiProperty()
	@Expose()
	updatedAt: Date;
}
