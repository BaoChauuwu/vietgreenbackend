import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { OtpChannel } from '@app/common/enums/otp-channel.enum';

export class SendChangePasswordOtpRequestDto {
	@ApiProperty({ enum: OtpChannel, example: OtpChannel.EMAIL })
	@IsNotEmpty()
	@IsEnum(OtpChannel)
	channel: OtpChannel;

	@ApiProperty({ description: 'Current password required before sending OTP' })
	@IsString()
	@IsNotEmpty()
	currentPassword: string;
}
