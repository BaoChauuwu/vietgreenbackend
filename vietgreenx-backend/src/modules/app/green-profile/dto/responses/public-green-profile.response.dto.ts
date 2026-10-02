import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { GreenProfileResponseDto } from './green-profile.response.dto';
import { CertificationType } from '@app/common/enums/certification-type.enum';
import { CertificationStatus } from '@app/common/enums/certification-status.enum';

export class GreenProfileCertSummaryDto {
	@ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
	@Expose()
	id: string;

	@ApiProperty({ enum: CertificationType, description: 'Certification type' })
	@Expose()
	certType: CertificationType;

	@ApiProperty({ example: 'VG-2026-9999', description: 'Certification number' })
	@Expose()
	certNumber: string | null;

	@ApiProperty({ example: '2028-01-15', description: 'Expiry date' })
	@Expose()
	expiryDate: string;

	@ApiProperty({
		enum: CertificationStatus,
		description: 'Certification status',
	})
	@Expose()
	status: CertificationStatus;
}

export class GreenProfileProductPreviewDto {
	@ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
	@Expose()
	id: string;

	@ApiProperty({ example: 'Organic Strawberries', description: 'Product name' })
	@Expose()
	name: string;
}

export class PublicGreenProfileResponseDto extends GreenProfileResponseDto {
	@ApiProperty({
		type: [GreenProfileCertSummaryDto],
		description: 'List of active certifications of the farm',
	})
	@Expose()
	@Type(() => GreenProfileCertSummaryDto)
	certifications: GreenProfileCertSummaryDto[];

	@ApiProperty({
		type: [GreenProfileProductPreviewDto],
		description: 'List of products produced by the farm',
	})
	@Expose()
	@Type(() => GreenProfileProductPreviewDto)
	products: GreenProfileProductPreviewDto[];
}
