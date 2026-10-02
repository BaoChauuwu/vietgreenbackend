import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class AdminLoginRequestDto {
	@ApiProperty({ type: String, example: 'bisdevt00@gmail.com' })
	@IsNotEmpty()
	@IsEmail()
	@IsString()
	@Transform(({ value }) => value.toLowerCase())
	email: string;

	@ApiProperty({ type: String, example: '123qwe!@#' })
	@IsNotEmpty()
	@IsString()
	password: string;
}
