import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

export class HashtagSearchItemDto {
	@ApiProperty({ example: 'caphe' })
	@Expose()
	tag: string;

	@ApiProperty({ example: 12 })
	@Expose()
	postCount: number;
}

export class HashtagSearchResponseDto {
	@ApiProperty({ type: [HashtagSearchItemDto] })
	@Expose()
	@Type(() => HashtagSearchItemDto)
	items: HashtagSearchItemDto[];
}
