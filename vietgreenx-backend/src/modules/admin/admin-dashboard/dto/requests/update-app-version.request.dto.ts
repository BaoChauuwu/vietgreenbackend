import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateAppVersionRequestDto {
	@ApiPropertyOptional()
	@IsOptional()
	@IsString()
	minVersion?: string;

	@ApiPropertyOptional()
	@IsOptional()
	@IsString()
	recommendedVersion?: string;

	@ApiPropertyOptional()
	@IsOptional()
	@IsBoolean()
	forceUpdate?: boolean;

	@ApiPropertyOptional()
	@IsOptional()
	@IsBoolean()
	softUpdate?: boolean;

	@ApiPropertyOptional()
	@IsOptional()
	@IsString()
	storeUrlIos?: string;

	@ApiPropertyOptional()
	@IsOptional()
	@IsString()
	storeUrlAndroid?: string;

	@ApiPropertyOptional()
	@IsOptional()
	@IsString()
	releaseNotesVi?: string;

	@ApiPropertyOptional()
	@IsOptional()
	@IsString()
	releaseNotesEn?: string;
}
