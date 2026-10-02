import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { CommentResponseDto } from './comment.response.dto';

export class CommentsResponseDto {
	@ApiProperty({ type: [CommentResponseDto] })
	@Expose()
	@Type(() => CommentResponseDto)
	items: CommentResponseDto[];

	@ApiProperty({ nullable: true, example: null })
	@Expose()
	nextCursor: string | null;

	@ApiProperty({ example: true })
	@Expose()
	hasNext: boolean;

	@ApiProperty({ example: 20 })
	@Expose()
	limit: number;
}
