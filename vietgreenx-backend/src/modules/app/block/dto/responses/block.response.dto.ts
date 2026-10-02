import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { BlockedUserResponseDto } from './blocked-user.response.dto';

export class BlockResponseDto {
	@ApiProperty()
	@Expose()
	id: string;

	@ApiProperty()
	@Expose()
	blockedUserId: string;

	@ApiProperty()
	@Expose()
	createdAt: Date;

	@ApiProperty({ type: () => BlockedUserResponseDto })
	@Expose()
	@Type(() => BlockedUserResponseDto)
	blockedUser: BlockedUserResponseDto;
}
