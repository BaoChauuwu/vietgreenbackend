import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserStatus } from '@app/common/enums/user-status.enum';

const ALLOWED: UserStatus[] = [
	UserStatus.ACTIVE,
	UserStatus.SUSPENDED,
	UserStatus.BANNED,
];

export class AdminUserChangeStatusRequestDto {
	@ApiProperty({
		enum: ALLOWED,
		description:
			'active = unlock · suspended = temporary lock · banned = permanent ban',
	})
	@IsNotEmpty()
	@IsEnum(ALLOWED)
	status: UserStatus;
}
