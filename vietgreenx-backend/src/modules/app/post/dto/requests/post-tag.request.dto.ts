import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
	IsEnum,
	IsNotEmpty,
	IsOptional,
	IsString,
	IsUUID,
	MaxLength,
} from 'class-validator';
import { PostTagType } from '@app/common/enums/post-tag-type.enum';

export class PostTagRequestDto {
	@ApiProperty({ enum: PostTagType, example: PostTagType.REGION })
	@IsEnum(PostTagType)
	tagType: PostTagType;

	@ApiPropertyOptional({
		example: '123e4567-e89b-12d3-a456-426614174000',
		description:
			'Reference ID (product or agriculture category). Optional for region.',
	})
	@IsOptional()
	@IsUUID('all', { message: 'refId must be a valid UUID' })
	refId?: string;

	@ApiProperty({ example: 'Hanoi', description: 'Display label for the tag' })
	@IsString()
	@IsNotEmpty()
	@MaxLength(255)
	refLabel: string;
}
