import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
	ArrayMaxSize,
	IsArray,
	IsDateString,
	IsEnum,
	IsNotEmpty,
	IsNumber,
	IsOptional,
	IsString,
	IsUUID,
	ValidateIf,
	Min,
} from 'class-validator';
import { ActivityType } from '@app/common/enums/activity-type.enum';

export class CreateProductionLogRequestDto {
	@ApiProperty({
		description: 'The date the activity was performed (YYYY-MM-DD)',
	})
	@IsNotEmpty()
	@IsDateString()
	logDate: string;

	@ApiProperty({
		description: 'The type of activity performed',
		enum: ActivityType,
	})
	@IsNotEmpty()
	@IsEnum(ActivityType)
	activityType: ActivityType;

	@ApiPropertyOptional({
		description: 'Input material used (e.g. fertilizer name, pesticide name)',
	})
	@IsOptional()
	@IsString()
	inputMaterial?: string;

	@ApiPropertyOptional({ description: 'Dosage or amount used' })
	@ValidateIf((o) => o.dosageUnit !== undefined && o.dosageUnit !== null)
	@IsNotEmpty({ message: 'dosage is required when dosageUnit is provided' })
	@IsString()
	dosage?: string;

	@ApiPropertyOptional({ description: 'Unit of the dosage (e.g. kg, liter)' })
	@ValidateIf((o) => o.dosage !== undefined && o.dosage !== null)
	@IsNotEmpty({ message: 'dosageUnit is required when dosage is provided' })
	@IsString()
	dosageUnit?: string;

	@ApiPropertyOptional({ description: 'Additional notes or observations' })
	@IsOptional()
	@IsString()
	notes?: string;

	@ApiPropertyOptional({
		description: 'Weather conditions during the activity',
	})
	@IsOptional()
	@IsString()
	weather?: string;

	@ApiPropertyOptional({ description: 'Pest status or observations' })
	@IsOptional()
	@IsString()
	pestStatus?: string;

	@ApiPropertyOptional({
		description: 'Estimated yield (usually relevant for harvesting activity)',
	})
	@IsOptional()
	@IsNumber()
	@Min(0)
	estimatedYield?: number;

	@ApiPropertyOptional({
		description:
			'List of attached media IDs (max 5). Note: Media must be uploaded with purpose: production_log_image.',
		type: [String],
	})
	@IsOptional()
	@IsArray()
	@IsUUID('all', { each: true })
	@ArrayMaxSize(5)
	mediaIds?: string[];
}
