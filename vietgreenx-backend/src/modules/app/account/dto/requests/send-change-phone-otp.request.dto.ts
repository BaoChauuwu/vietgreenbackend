import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class SendChangePhoneOtpRequestDto {
	@ApiProperty({ example: '123qwe!@#' })
	@IsNotEmpty()
	@IsString()
	currentPassword: string;

	@ApiProperty({
		example: '0912345678',
		description: 'Vietnamese phone number',
	})
	@IsString()
	@IsNotEmpty()
	@Matches(/^(0|\+84)[3-9][0-9]{8}$/, { message: 'Phone number is invalid' })
	newPhone: string;
}
