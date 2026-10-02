import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class ChangeEmailVerifyOtpRequestDto {
	@ApiProperty({ example: '000000' })
	@IsNotEmpty()
	@IsString()
	otp: string;

	@ApiProperty({ example: 'bisdevt00@gmail.com' })
	@IsNotEmpty()
	@IsEmail()
	newEmail: string;
}
