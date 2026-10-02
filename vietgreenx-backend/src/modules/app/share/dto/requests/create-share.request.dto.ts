import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
	IsNotEmpty,
	IsOptional,
	IsString,
	IsUUID,
	IsEnum,
	MaxLength,
} from 'class-validator';
import { VisibilityType } from '@app/common/enums/visibility-type.enum';
import { ShareType } from '@app/common/enums/share-type.enum';

const MAX_SHARE_CAPTION_LENGTH = 2000;

export class CreateShareRequestDto {
	@ApiProperty({
		description: 'The ID of the original post to share',
		example: '123e4567-e89b-12d3-a456-426614174000',
	})
	@IsNotEmpty()
	@IsUUID()
	postId: string;

	@ApiPropertyOptional({
		description: 'Optional caption or comment when sharing the post',
		example: 'This post is very helpful!',
		maxLength: MAX_SHARE_CAPTION_LENGTH,
	})
	@IsOptional()
	@IsString()
	@MaxLength(MAX_SHARE_CAPTION_LENGTH)
	caption?: string;

	@ApiPropertyOptional({
		description:
			'The type of share: repost (to user feed) or external_link (copy link)',
		enum: ShareType,
		default: ShareType.REPOST,
	})
	@IsOptional()
	@IsEnum(ShareType)
	shareType?: ShareType;

	@ApiPropertyOptional({
		description: 'Visibility of the new post if shareType is repost',
		enum: VisibilityType,
		default: VisibilityType.PUBLIC,
	})
	@IsOptional()
	@IsEnum(VisibilityType)
	visibility?: VisibilityType;
}
