import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class AdminChangePasswordRequestDto {
	@ApiProperty({
		description: 'The old password of the user',
		example: 'oldPassword',
	})
	@IsNotEmpty()
	@IsString()
	@MinLength(6)
	oldPassword: string;

	@ApiProperty({
		description: 'The new password of the user',
		example: 'newPassword',
	})
	@IsNotEmpty()
	@IsString()
	@MinLength(6)
	newPassword: string;
}
