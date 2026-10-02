import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { PostResponseDto } from '@app/modules/app/post/dto/responses/post.response.dto';

export class FeedResponseDto {
	@ApiProperty({ type: [PostResponseDto] })
	@Expose()
	@Type(() => PostResponseDto)
	items: PostResponseDto[];

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
