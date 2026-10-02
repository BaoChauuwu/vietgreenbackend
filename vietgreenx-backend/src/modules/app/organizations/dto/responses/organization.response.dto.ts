import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';

export class OrganizationResponseDto {
	@ApiProperty()
	@Expose()
	id: string;

	@ApiProperty()
	@Expose()
	name: string;

	@ApiProperty()
	@Expose()
	slug: string;

	@ApiProperty()
	@Expose()
	orgType: string;

	@ApiPropertyOptional()
	@Expose()
	taxCode: string | null;

	@ApiPropertyOptional()
	@Expose()
	registrationNumber: string | null;

	@ApiPropertyOptional()
	@Expose()
	province: string | null;

	@ApiPropertyOptional()
	@Expose()
	district: string | null;

	@ApiPropertyOptional()
	@Expose()
	ward: string | null;

	@ApiPropertyOptional()
	@Expose()
	registrationCertUrl: string | null;

	@ApiProperty()
	@Expose()
	isActive: boolean;

	@ApiProperty()
	@Expose()
	memberLimit: number;

	@ApiProperty()
	@Expose()
	followerCount: number;

	@ApiProperty()
	@Expose()
	memberCount: number;

	@ApiPropertyOptional()
	@Expose()
	website: string | null;

	@ApiPropertyOptional()
	@Expose()
	address: string | null;

	@ApiPropertyOptional()
	@Expose()
	description: string | null;

	@ApiProperty()
	@Expose()
	verificationLevel: string;

	@ApiPropertyOptional()
	@Expose()
	@Transform(({ obj }) => obj.logoMedia?.cdnUrl || null)
	logoUrl: string | null;

	@ApiPropertyOptional()
	@Expose()
	@Transform(({ obj }) => obj.coverMedia?.cdnUrl || null)
	coverUrl: string | null;

	@ApiProperty()
	@Expose()
	createdAt: Date;
}
