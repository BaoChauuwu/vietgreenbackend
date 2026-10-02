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

export class UpdatePostRequestDto {
	@ApiPropertyOptional({ maxLength: 2000 })
	@IsOptional()
	@IsString()
	@MaxLength(2000)
	body?: string;

	@ApiPropertyOptional({ enum: PostCategory })
	@IsOptional()
	@IsEnum(PostCategory)
	category?: PostCategory;

	@ApiPropertyOptional({ enum: VisibilityType })
	@IsOptional()
	@IsEnum(VisibilityType)
	visibility?: VisibilityType;

	@ApiPropertyOptional({
		type: [String],
		description:
			'Media IDs from POST /app/media/upload-url (purpose=post_image). Replaces all attached media when provided',
	})
	@IsOptional()
	@IsArray()
	@IsUUID('all', { each: true, message: 'Each mediaId must be a valid UUID' })
	@ArrayMaxSize(9)
	mediaIds?: string[];

	@ApiPropertyOptional({
		type: [PostTagRequestDto],
		description: 'Replaces all tags when provided',
	})
	@IsOptional()
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => PostTagRequestDto)
	@ArrayMaxSize(20)
	tags?: PostTagRequestDto[];
}
