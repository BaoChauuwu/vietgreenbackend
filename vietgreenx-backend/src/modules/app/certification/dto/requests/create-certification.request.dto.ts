import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
	IsDateString,
	IsEnum,
	IsNotEmpty,
	IsOptional,
	IsString,
	IsUUID,
} from 'class-validator';
import { CertificationType } from '@app/common/enums/certification-type.enum';

export class CreateCertificationRequestDto {
	@ApiProperty({ description: 'ID of the Green Profile' })
	@IsUUID()
	greenProfileId: string;

	@ApiProperty({ enum: CertificationType, description: 'Certification type' })
	@IsEnum(CertificationType)
	certType: CertificationType;

	@ApiPropertyOptional({ description: 'Certification number' })
	@IsOptional()
	@IsString()
	certNumber?: string;

	@ApiProperty({ description: 'Issuing authority' })
	@IsString()
	@IsNotEmpty()
	issuingAuthority: string;

	@ApiProperty({ description: 'Issue date (YYYY-MM-DD)' })
	@IsDateString()
	issueDate: string;

	@ApiProperty({ description: 'Expiry date (YYYY-MM-DD)' })
	@IsDateString()
	expiryDate: string;

	@ApiProperty({ description: 'Storage Key or URL of the uploaded document' })
	@IsString()
	@IsNotEmpty()
	documentUrl: string;
}
