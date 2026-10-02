import { ApiPropertyOptional } from '@nestjs/swagger';
import {
	ArrayMaxSize,
	IsArray,
	IsEnum,
	IsOptional,
	IsString,
	IsUUID,
	MaxLength,
	ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PostCategory } from '@app/common/enums/post-category.enum';
import { VisibilityType } from '@app/common/enums/visibility-type.enum';
import { PostTagRequestDto } from './post-tag.request.dto';

export class CreatePostRequestDto {
	@ApiPropertyOptional({
		example: 'Harvested fresh vegetables from the farm today...',
		maxLength: 2000,
	})
	@IsOptional()
	@IsString()
	@MaxLength(2000)
	body?: string;

	@ApiPropertyOptional({
		enum: PostCategory,
		example: PostCategory.PRODUCE_STORY,
		description: 'Post content category (not agriculture catalog category)',
	})
	@IsOptional()
	@IsEnum(PostCategory)
	category?: PostCategory;

	@ApiPropertyOptional({
		enum: VisibilityType,
		example: VisibilityType.PUBLIC,
		default: VisibilityType.PUBLIC,
	})
	@IsOptional()
	@IsEnum(VisibilityType)
	visibility?: VisibilityType;

	@ApiPropertyOptional({
		type: [String],
		description:
			'Media IDs from POST /app/media/upload-url (purpose=post_image), in display order',
	})
	@IsOptional()
	@IsArray()
	@IsUUID('all', { each: true, message: 'Each mediaId must be a valid UUID' })
	@ArrayMaxSize(9)
	mediaIds?: string[];

	@ApiPropertyOptional({ type: [PostTagRequestDto] })
	@IsOptional()
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => PostTagRequestDto)
	@ArrayMaxSize(20)
	tags?: PostTagRequestDto[];
}
