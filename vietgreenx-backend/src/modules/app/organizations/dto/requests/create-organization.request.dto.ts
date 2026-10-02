import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
	IsEnum,
	IsNotEmpty,
	IsOptional,
	IsString,
	IsUUID,
	IsUrl,
} from 'class-validator';
import { OrgType } from '@app/common/enums/org-type.enum';

export class CreateOrganizationRequestDto {
	@ApiProperty({
		description: 'Name of the organization',
		example: 'Green Cooperative',
	})
	@IsNotEmpty()
	@IsString()
	name: string;

	@ApiProperty({ description: 'Type of the organization', enum: OrgType })
	@IsNotEmpty()
	@IsEnum(OrgType)
	orgType: OrgType;

	@ApiPropertyOptional({ description: 'Tax code' })
	@IsOptional()
	@IsString()
	taxCode?: string;

	@ApiPropertyOptional({ description: 'Registration number' })
	@IsOptional()
	@IsString()
	registrationNumber?: string;

	@ApiPropertyOptional({ description: 'Website URL' })
	@IsOptional()
	@IsString()
	website?: string;

	@ApiPropertyOptional({ description: 'Organization description' })
	@IsOptional()
	@IsString()
	description?: string;

	@ApiPropertyOptional({ description: 'Address' })
	@IsOptional()
	@IsString()
	address?: string;

	@ApiPropertyOptional({ description: 'Province / City' })
	@IsOptional()
	@IsString()
	province?: string;

	@ApiPropertyOptional({ description: 'District/County' })
	@IsOptional()
	@IsString()
	district?: string;

	@ApiPropertyOptional({ description: 'Ward / Commune' })
	@IsOptional()
	@IsString()
	ward?: string;

	@ApiPropertyOptional({ description: 'ID Logo Image' })
	@IsOptional()
	@IsUUID()
	logoMediaId?: string;

	@ApiPropertyOptional({ description: 'ID Cover Image' })
	@IsOptional()
	@IsUUID()
	coverMediaId?: string;

	@ApiPropertyOptional({ description: 'Business License' })
	@IsOptional()
	@IsUrl()
	registrationCertUrl?: string;
}
