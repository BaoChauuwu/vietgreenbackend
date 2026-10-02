import { IsEmail, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class AdminForgotPasswordRequestDto {
	@ApiProperty({
		description: 'The email of the user',
		example: 'test@example.com',
	})
	@IsNotEmpty()
	@IsEmail()
	@Transform(({ value }) => value.toLowerCase())
	email: string;
}
