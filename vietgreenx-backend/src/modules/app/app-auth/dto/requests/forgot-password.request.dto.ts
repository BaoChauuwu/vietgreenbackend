import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, Matches } from 'class-validator';

export class ForgotPasswordRequestDto {
	@ApiPropertyOptional({
		example: '0912345678',
		description: 'Enter phone or email, no need both',
	})
	@IsString()
	@IsOptional()
	@Matches(/^(0|\+84)[3-9][0-9]{8}$/, { message: 'Phone number is invalid' })
	phone?: string;

	@ApiPropertyOptional({ example: 'user@example.com' })
	@IsEmail({}, { message: 'Email is invalid' })
	@IsOptional()
	email?: string;
}
