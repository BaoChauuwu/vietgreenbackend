import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { UserSearchItemResponseDto } from './user-search-item.response.dto';

export class UserSearchResponseDto {
	@ApiProperty({ type: [UserSearchItemResponseDto] })
	@Expose()
	@Type(() => UserSearchItemResponseDto)
	items: UserSearchItemResponseDto[];
}
