import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { CertificationType } from '@app/common/enums/certification-type.enum';
import { CertificationStatus } from '@app/common/enums/certification-status.enum';

export class AdminCertificationResponseDto {
	@ApiProperty()
	@Expose()
	id: string;

	@ApiProperty()
	@Expose()
	greenProfileId: string;

	@ApiProperty({ enum: CertificationType })
	@Expose()
	certType: CertificationType;

	@ApiPropertyOptional({ nullable: true })
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

	@ApiProperty({ description: 'Name of the green profile that owns this cert' })
	@Expose()
	profileName: string;

	@ApiProperty({ description: 'Storage key / URL of the document' })
	@Expose()
	documentUrl: string;

	@ApiProperty({ enum: CertificationStatus })
	@Expose()
	status: CertificationStatus;

	@ApiPropertyOptional({ nullable: true })
	@Expose()
	adminNote: string | null;

	@ApiPropertyOptional({ nullable: true })
	@Expose()
	reviewedBy: string | null;

	@ApiPropertyOptional({ nullable: true })
	@Expose()
	reviewedAt: Date | null;

	@ApiProperty()
	@Expose()
	createdAt: Date;

	@ApiProperty()
	@Expose()
	updatedAt: Date;
}
