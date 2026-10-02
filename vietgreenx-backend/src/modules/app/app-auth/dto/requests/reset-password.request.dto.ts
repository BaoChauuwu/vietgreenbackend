import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
	IsEmail,
	IsNotEmpty,
	IsOptional,
	IsString,
	Matches,
} from 'class-validator';

export class ResetPasswordRequestDto {
	@ApiPropertyOptional({
		example: '0912345678',
		description: 'Phone (if reset via phone OTP)',
	})
	@IsString()
	@IsOptional()
	@Matches(/^(0|\+84)[3-9][0-9]{8}$/, { message: 'Phone number is invalid' })
	phone?: string;

	@ApiPropertyOptional({ description: 'Email (if reset via email OTP)' })
	@IsEmail()
	@IsOptional()
	email?: string;

	@ApiProperty({ example: '123456', description: '6-digit OTP received' })
	@IsString()
	@IsNotEmpty()
	otp: string;

	@ApiProperty({ example: '123qwe!@#' })
	@IsString()
	@IsNotEmpty()
	@Matches(/^(?=.*[A-Za-z])(?=.*\d).{8,}$/, {
		message:
			'Password must be at least 8 characters long, contain at least 1 letter and 1 number',
	})
	newPassword: string;
}
