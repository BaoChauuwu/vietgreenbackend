import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class RegisterEmailRequestDto {
	@ApiProperty({ example: 'user@example.com' })
	@IsEmail({}, { message: 'Email is invalid' })
	@IsNotEmpty()
	email: string;
}
