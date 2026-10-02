import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { PostTagType } from '@app/common/enums/post-tag-type.enum';

export class PostTagResponseDto {
	@ApiProperty({ enum: PostTagType })
	@Expose()
	tagType: PostTagType;

	@ApiPropertyOptional({ nullable: true })
	@Expose()
	refId: string | null;

	@ApiProperty()
	@Expose()
	refLabel: string;
}
