import { RequireBoth } from '@app/common/decorators/require-both.decorator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
	ArrayMaxSize,
	IsArray,
	IsEmail,
	IsInt,
	IsLatitude,
	IsLongitude,
	IsNotEmpty,
	IsNumber,
	IsOptional,
	IsString,
	IsUUID,
	Min,
} from 'class-validator';

export class CreateGreenProfileRequestDto {
	@ApiPropertyOptional({
		description: 'Organization ID if creating a profile for an Organization',
	})
	@IsOptional()
	@IsUUID('all')
	organizationId?: string;

	@ApiProperty({ description: 'Green Profile name' })
	@IsString()
	@IsNotEmpty()
	profileName: string;

	@ApiProperty({ description: 'Province / City' })
	@IsString()
	@IsNotEmpty()
	province: string;

	@ApiPropertyOptional({ description: 'District' })
	@IsOptional()
	@IsString()
	district?: string;

	@ApiPropertyOptional({ description: 'Ward / Commune' })
	@IsOptional()
	@IsString()
	ward?: string;

	@ApiPropertyOptional({ description: 'Detailed address' })
	@IsOptional()
	@IsString()
	addressDetail?: string;

	@ApiPropertyOptional({
		example: 1,
		description: 'Province code từ provinces.open-api.vn',
	})
	@IsOptional()
	@IsInt()
	@Min(1)
	provinceCode?: number;

	@ApiPropertyOptional({ example: 10 })
	@IsOptional()
	@IsInt()
	@Min(1)
	districtCode?: number;

	@ApiPropertyOptional({ example: 250 })
	@IsOptional()
	@IsInt()
	@Min(1)
	wardCode?: number;

	@ApiPropertyOptional({ description: 'Agricultural growing zone code' })
	@IsOptional()
	@IsString()
	growingZoneCode?: string;

	@ApiPropertyOptional({
		description: 'List of main agricultural category IDs',
		type: [String],
	})
	@IsOptional()
	@IsArray()
	@IsUUID('all', { each: true })
	mainCategoryIds?: string[];

	@ApiPropertyOptional({ description: 'Farm area (ha)' })
	@IsOptional()
	@IsNumber()
	@Min(0)
	farmAreaHa?: number;

	@ApiPropertyOptional({ description: 'Estimated annual yield (tonnes)' })
	@IsOptional()
	@IsNumber()
	@Min(0)
	annualYieldTonnes?: number;

	@ApiPropertyOptional({ description: 'Avatar image media ID' })
	@IsOptional()
	@IsUUID('all')
	avatarMediaId?: string;

	@ApiPropertyOptional({
		description: 'List of farm photo media IDs (max 20)',
		type: [String],
	})
	@IsOptional()
	@IsArray()
	@IsUUID('all', { each: true })
	@ArrayMaxSize(20)
	photoMediaIds?: string[];

	@ApiPropertyOptional({
		description: 'List of farm video media IDs (max 3)',
		type: [String],
	})
	@IsOptional()
	@IsArray()
	@IsUUID('all', { each: true })
	@ArrayMaxSize(3)
	videoMediaIds?: string[];

	@ApiPropertyOptional({ description: 'Meta description (SEO)' })
	@IsOptional()
	@IsString()
	metaDescription?: string;

	@ApiPropertyOptional({ description: 'Contact phone number' })
	@IsOptional()
	@IsString()
	phone?: string;

	@ApiPropertyOptional({ description: 'Website URL' })
	@IsOptional()
	@IsString()
	website?: string;

	@ApiPropertyOptional({ description: 'Contact email' })
	@IsOptional()
	@IsEmail()
	email?: string;

	@ApiPropertyOptional({ description: 'Farm latitude' })
	@IsOptional()
	@RequireBoth('longitude')
	@IsLatitude()
	latitude?: number;

	@ApiPropertyOptional({ description: 'Farm longitude' })
	@IsOptional()
	@RequireBoth('latitude')
	@IsLongitude()
	longitude?: number;
}
