import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Transform, Type } from 'class-transformer';
import { PostCategory } from '@app/common/enums/post-category.enum';
import { PostSource } from '@app/common/enums/post-source.enum';
import { VisibilityType } from '@app/common/enums/visibility-type.enum';
import { PostAuthorResponseDto } from './post-author.response.dto';
import { PostMediaResponseDto } from './post-media.response.dto';
import { PostTagResponseDto } from './post-tag.response.dto';

export class PostResponseDto {
	@ApiProperty()
	@Expose()
	id: string;

	@ApiProperty()
	@Expose()
	authorId: string;

	@ApiPropertyOptional({ nullable: true })
	@Expose()
	body: string | null;

	@ApiProperty({ enum: VisibilityType })
	@Expose()
	visibility: VisibilityType;

	@ApiPropertyOptional({ enum: PostCategory, nullable: true })
	@Expose()
	category: PostCategory | null;

	@ApiProperty()
	@Expose()
	isEdited: boolean;

	@ApiProperty()
	@Expose()
	reactionCount: number;

	@ApiProperty({
		example: { like: 5, love: 3, green: 2 },
		description:
			'Count per reaction type — only types with count > 0 are included',
	})
	@Expose()
	@Transform(({ obj }) => obj.reactionBreakdown ?? {})
	reactionBreakdown: Record<string, number>;

	@ApiProperty({ default: false })
	@Expose()
	viewerHasReacted: boolean;

	@ApiPropertyOptional({
		nullable: true,
		enum: ['like', 'love', 'helpful', 'trust', 'green'],
		description: "Current viewer's reaction type, null if not reacted",
	})
	@Expose()
	viewerReaction: string | null;

	@ApiProperty()
	@Expose()
	commentCount: number;

	@ApiProperty()
	@Expose()
	shareCount: number;

	@ApiProperty()
	@Expose()
	viewCount: number;

	@ApiProperty()
	@Expose()
	createdAt: Date;

	@ApiProperty()
	@Expose()
	updatedAt: Date;

	@ApiPropertyOptional({ enum: PostSource, nullable: true })
	@Expose()
	source: PostSource | null;

	@ApiPropertyOptional({
		nullable: true,
		example: { originalPostId: 'uuid' },
	})
	@Expose()
	sourceMetadata: Record<string, unknown>;

	@ApiProperty({ type: PostAuthorResponseDto })
	@Expose()
	@Type(() => PostAuthorResponseDto)
	author: PostAuthorResponseDto;

	@ApiProperty({ type: [PostMediaResponseDto] })
	@Expose()
	@Type(() => PostMediaResponseDto)
	media: PostMediaResponseDto[];

	@ApiProperty({ type: [PostTagResponseDto] })
	@Expose()
	@Type(() => PostTagResponseDto)
	tags: PostTagResponseDto[];

	@ApiProperty({
		type: [String],
		example: ['caphe', 'vietshop'],
		description: 'Social hashtags parsed from body (normalized, without #)',
	})
	@Expose()
	hashtags: string[];

	@ApiPropertyOptional({
		type: () => PostResponseDto,
		nullable: true,
		description: 'Embedded original post when source is repost',
	})
	@Expose()
	@Type(() => PostResponseDto)
	originalPost?: PostResponseDto | null;
}

export class PostMediaUploadResponseDto {
	@ApiProperty()
	@Expose()
	id: string;

	@ApiProperty()
	@Expose()
	cdnUrl: string;

	@ApiProperty()
	@Expose()
	mimeType: string;
}
