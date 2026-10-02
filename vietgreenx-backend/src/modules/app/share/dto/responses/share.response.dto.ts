import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { ShareType } from '@app/common/enums/share-type.enum';
import { PostResponseDto } from '@app/modules/app/post/dto/responses/post.response.dto';

export class ShareResponseDto {
	@ApiProperty()
	@Expose()
	id: string;

	@ApiProperty()
	@Expose()
	userId: string;

	@ApiProperty()
	@Expose()
	postId: string;

	@ApiPropertyOptional({ nullable: true })
	@Expose()
	caption: string | null;

	@ApiProperty({ enum: ShareType })
	@Expose()
	shareType: ShareType;

	@ApiProperty()
	@Expose()
	createdAt: Date;

	@ApiPropertyOptional({
		nullable: true,
		description: 'The ID of the newly created post if shareType is repost',
	})
	@Expose()
	repostPostId: string | null;

	@ApiPropertyOptional({
		type: () => PostResponseDto,
		nullable: true,
		description: 'Full repost post detail including embedded originalPost',
	})
	@Expose()
	@Type(() => PostResponseDto)
	repostPost?: PostResponseDto | null;
}
