import { IsNullable } from '@app/common/decorators/is-nullable.decorator';
import { RequireBoth } from '@app/common/decorators/require-both.decorator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
	ArrayMaxSize,
	IsArray,
	IsEmail,
	IsInt,
	IsLatitude,
	IsLongitude,
	IsNumber,
	IsOptional,
	IsString,
	IsUUID,
	Min,
} from 'class-validator';

export class UpdateGreenProfileRequestDto {
	@ApiPropertyOptional({ description: 'Green Profile name' })
	@IsOptional()
	@IsString()
	profileName?: string;

	@ApiPropertyOptional({ description: 'Province / City' })
	@IsOptional()
	@IsString()
	province?: string;

	@ApiPropertyOptional({ description: 'District. Send null to clear.' })
	@IsOptional()
	@IsNullable()
	@IsString()
	district?: string | null;

	@ApiPropertyOptional({ description: 'Ward / Commune. Send null to clear.' })
	@IsOptional()
	@IsNullable()
	@IsString()
	ward?: string | null;

	@ApiPropertyOptional({ description: 'Detailed address. Send null to clear.' })
	@IsOptional()
	@IsNullable()
	@IsString()
	addressDetail?: string | null;

	@ApiPropertyOptional({
		example: 1,
		description: 'Province code từ provinces.open-api.vn',
	})
	@IsOptional()
	@IsInt()
	@Min(1)
	provinceCode?: number;

	@ApiPropertyOptional({
		example: 10,
		description: 'District code. Send null to clear when changing province.',
	})
	@IsOptional()
	@IsNullable()
	@IsInt()
	@Min(1)
	districtCode?: number | null;

	@ApiPropertyOptional({
		example: 250,
		description: 'Ward code. Send null to clear when changing province.',
	})
	@IsOptional()
	@IsNullable()
	@IsInt()
	@Min(1)
	wardCode?: number | null;

	@ApiPropertyOptional({
		description: 'Agricultural growing zone code. Send null to clear.',
	})
	@IsOptional()
	@IsNullable()
	@IsString()
	growingZoneCode?: string | null;

	@ApiPropertyOptional({
		description: 'List of main agricultural category IDs',
		type: [String],
	})
	@IsOptional()
	@IsArray()
	@IsUUID('all', { each: true })
	mainCategoryIds?: string[];

	@ApiPropertyOptional({ description: 'Farm area (ha). Send null to clear.' })
	@IsOptional()
	@IsNullable()
	@IsNumber()
	@Min(0)
	farmAreaHa?: number | null;

	@ApiPropertyOptional({
		description: 'Estimated annual yield (tonnes). Send null to clear.',
	})
	@IsOptional()
	@IsNullable()
	@IsNumber()
	@Min(0)
	annualYieldTonnes?: number | null;

	@ApiPropertyOptional({
		description: 'Avatar image media ID. Send null to remove avatar.',
	})
	@IsOptional()
	@IsNullable()
	@IsUUID('all')
	avatarMediaId?: string | null;

	@ApiPropertyOptional({
		description: 'List of farm photo media IDs (max 20). Send [] to clear all.',
		type: [String],
	})
	@IsOptional()
	@IsArray()
	@IsUUID('all', { each: true })
	@ArrayMaxSize(20)
	photoMediaIds?: string[];

	@ApiPropertyOptional({
		description: 'List of farm video media IDs (max 3). Send [] to clear all.',
		type: [String],
	})
	@IsOptional()
	@IsArray()
	@IsUUID('all', { each: true })
	@ArrayMaxSize(3)
	videoMediaIds?: string[];

	@ApiPropertyOptional({
		description: 'Meta description (SEO). Send null to clear.',
	})
	@IsOptional()
	@IsNullable()
	@IsString()
	metaDescription?: string | null;

	@ApiPropertyOptional({
		description: 'Contact phone number. Send null to clear.',
	})
	@IsOptional()
	@IsNullable()
	@IsString()
	phone?: string | null;

	@ApiPropertyOptional({ description: 'Website URL. Send null to clear.' })
	@IsOptional()
	@IsNullable()
	@IsString()
	website?: string | null;

	@ApiPropertyOptional({ description: 'Contact email. Send null to clear.' })
	@IsOptional()
	@IsNullable()
	@IsEmail()
	email?: string | null;

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
