import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsOptional, IsString } from 'class-validator';

export class CreateAppVersionRequestDto {
	@ApiProperty({ enum: ['ios', 'android'] })
	@IsIn(['ios', 'android'])
	platform: string;

	@ApiProperty()
	@IsString()
	latestVersion: string;

	@ApiProperty()
	@IsString()
	minVersion: string;

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
