import { IsEnum, IsNotEmpty } from 'class-validator';
import { UserRole } from '@app/common/enums/user-role.enum';
import { ApiProperty } from '@nestjs/swagger';

export class AdminUserChangeRoleRequestDto {
	@ApiProperty({
		example: UserRole.ADMIN,
	})
	@IsNotEmpty()
	@IsEnum(UserRole)
	newRole: UserRole;
}
