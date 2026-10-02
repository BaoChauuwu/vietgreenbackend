import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class AppVersionResponseDto {
	@ApiProperty()
	@Expose()
	id: string;

	@ApiProperty()
	@Expose()
	platform: string;

	@ApiProperty()
	@Expose()
	latestVersion: string;

	@ApiProperty()
	@Expose()
	minVersion: string;

	@ApiPropertyOptional()
	@Expose()
	recommendedVersion: string | null;

	@ApiProperty()
	@Expose()
	forceUpdate: boolean;

	@ApiProperty()
	@Expose()
	softUpdate: boolean;

	@ApiPropertyOptional()
	@Expose()
	storeUrlIos: string | null;

	@ApiPropertyOptional()
	@Expose()
	storeUrlAndroid: string | null;

	@ApiPropertyOptional()
	@Expose()
	releaseNotesVi: string | null;

	@ApiPropertyOptional()
	@Expose()
	releaseNotesEn: string | null;

	@ApiProperty()
	@Expose()
	releasedAt: Date;

	@ApiProperty()
	@Expose()
	createdAt: Date;
}
