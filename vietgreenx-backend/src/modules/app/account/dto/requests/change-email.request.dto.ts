import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class ChangeEmailRequestDto {
	@ApiProperty({ example: '123qwe!@#' })
	@IsNotEmpty()
	@IsString()
	currentPassword: string;

	@ApiProperty({ example: 'bisdevt00@gmail.com' })
	@IsNotEmpty()
	@IsEmail()
	newEmail: string;
}
