import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
	IsBoolean,
	IsInt,
	IsNotEmpty,
	IsOptional,
	IsString,
	IsUrl,
	IsUUID,
	Matches,
	MaxLength,
	Min,
} from 'class-validator';

export class CreateCategoryRequestDto {
	@ApiProperty({
		example: 'Vegetables',
		description: 'Category name in Vietnamese',
	})
	@IsString()
	@IsNotEmpty()
	@MaxLength(255)
	nameVi: string;

	@ApiProperty({
		example: 'Vegetables',
		description: 'Category name in English',
	})
	@IsString()
	@IsNotEmpty()
	@MaxLength(255)
	nameEn: string;

	@ApiProperty({
		example: 'vegetables',
		description:
			'Static slug URL, containing only lowercase letters, numbers, and hyphens',
	})
	@IsString()
	@IsNotEmpty()
	@MaxLength(255)
	@Matches(/^[a-z0-9-]+$/, {
		message:
			'Slug can only contain lowercase letters, numbers, and hyphens (-)',
	})
	slug: string;

	@ApiPropertyOptional({
		example: '123e4567-e89b-12d3-a456-426614174000',
		description: 'Parent category ID (if any)',
	})
	@IsOptional()
	@IsUUID('all', { message: 'parentId must be a valid UUID' })
	parentId?: string;

	@ApiPropertyOptional({
		example: 'https://s3.amazonaws.com/vietgreenx/icons/vegetable.png',
		description: 'Icon URL of the category',
	})
	@IsOptional()
	@IsString()
	@IsUrl({}, { message: 'iconUrl must be a valid URL string' })
	iconUrl?: string;

	@ApiPropertyOptional({ example: 1, description: 'Display sort order' })
	@IsOptional()
	@IsInt()
	@Min(0)
	sortOrder?: number;

	@ApiPropertyOptional({ example: true, description: 'Active status' })
	@IsOptional()
	@IsBoolean()
	isActive?: boolean;
}
