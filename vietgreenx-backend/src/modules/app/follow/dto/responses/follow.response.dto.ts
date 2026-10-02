import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { FollowStatus } from '@app/common/enums/follow-status.enum';

export class FollowResponseDto {
	@ApiProperty({
		enum: FollowStatus,
		example: FollowStatus.ACTIVE,
		description: 'The status of the follow relationship (active or pending)',
	})
	@Expose()
	status: FollowStatus;
}
