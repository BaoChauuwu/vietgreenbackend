import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString, Matches } from 'class-validator';
import { OtpChannel } from '@app/common/enums/otp-channel.enum';

export class ChangePasswordRequestDto {
	@ApiProperty({ example: '123qwe!@#' })
	@IsNotEmpty()
	currentPassword: string;

	@ApiProperty({ example: '123qwe!@#' })
	@IsNotEmpty()
	@IsString()
	@Matches(/^(?=.*[A-Za-z])(?=.*\d).{8,}$/, {
		message:
			'Password must be at least 8 characters long, contain at least 1 letter and 1 number',
	})
	newPassword: string;

	@ApiProperty({ example: '123qwe!@#' })
	@IsNotEmpty()
	@IsString()
	verifyPassword: string;

	@ApiProperty({ enum: OtpChannel, example: OtpChannel.EMAIL })
	@IsNotEmpty()
	@IsEnum(OtpChannel)
	channel: OtpChannel;

	@ApiProperty({ example: '123456', description: '6-digit OTP' })
	@IsNotEmpty()
	@IsString()
	otp: string;
}
