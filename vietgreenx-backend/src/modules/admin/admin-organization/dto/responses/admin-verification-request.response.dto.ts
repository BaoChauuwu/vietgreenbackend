import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

class VerificationSubmitterDto {
	@ApiProperty()
	@Expose()
	id: string;

	@ApiProperty()
	@Expose()
	username: string;

	@ApiPropertyOptional()
	@Expose()
	email: string | null;
}

class VerificationOrganizationDto {
	@ApiProperty()
	@Expose()
	id: string;

	@ApiProperty()
	@Expose()
	name: string;

	@ApiProperty()
	@Expose()
	slug: string;
}

export class AdminVerificationRequestResponseDto {
	@ApiProperty()
	@Expose()
	id: string;

	@ApiPropertyOptional()
	@Expose()
	organizationId: string | null;

	@ApiProperty()
	@Expose()
	requestedLevel: string;

	@ApiProperty()
	@Expose()
	documentType: string;

	@ApiProperty()
	@Expose()
	documentFrontUrl: string;

	@ApiPropertyOptional()
	@Expose()
	documentBackUrl: string | null;

	@ApiProperty()
	@Expose()
	status: string;

	@ApiProperty()
	@Expose()
	submittedAt: Date;

	@ApiPropertyOptional({ type: VerificationOrganizationDto })
	@Expose()
	@Type(() => VerificationOrganizationDto)
	organization: VerificationOrganizationDto | null;

	@ApiPropertyOptional({ type: VerificationSubmitterDto })
	@Expose()
	@Type(() => VerificationSubmitterDto)
	user: VerificationSubmitterDto | null;
}
