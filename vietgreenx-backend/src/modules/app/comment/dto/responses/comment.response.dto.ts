import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Transform, Type } from 'class-transformer';
import { CommentAuthorResponseDto } from './comment-author.response.dto';

export class CommentResponseDto {
	@ApiProperty()
	@Expose()
	id: string;

	@ApiProperty()
	@Expose()
	postId: string;

	@ApiPropertyOptional({ nullable: true })
	@Expose()
	parentCommentId: string | null;

	@ApiPropertyOptional({ nullable: true })
	@Expose()
	replyToCommentId: string | null;

	@ApiPropertyOptional({ type: CommentAuthorResponseDto, nullable: true })
	@Expose()
	@Transform(({ obj }) =>
		obj.replyToUser
			? {
					userId: obj.replyToUser.id,
					displayName: obj.replyToUser.profile?.displayName ?? '',
					avatarUrl: obj.replyToUser.profile?.avatarMedia?.cdnUrl ?? null,
				}
			: null,
	)
	replyToAuthor: CommentAuthorResponseDto | null;

	@ApiProperty()
	@Expose()
	body: string;

	@ApiProperty()
	@Expose()
	reactionCount: number;

	@ApiPropertyOptional({ nullable: true, type: String })
	@Expose()
	userReaction: string | null;

	@ApiProperty({ type: CommentAuthorResponseDto })
	@Expose()
	@Type(() => CommentAuthorResponseDto)
	author: CommentAuthorResponseDto;

	@ApiProperty()
	@Expose()
	createdAt: Date;
}
