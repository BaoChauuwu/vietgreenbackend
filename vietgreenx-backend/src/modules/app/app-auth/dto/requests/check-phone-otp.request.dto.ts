import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches } from 'class-validator';
import {
	VIETNAMESE_PHONE_REGEX,
	OTP_CODE_REGEX,
} from '@app/common/utils/normalize-vietnamese-phone';

export class CheckPhoneOtpRequestDto {
	@ApiProperty({ example: '0912345678' })
	@IsString()
	@IsNotEmpty()
	@Matches(VIETNAMESE_PHONE_REGEX, { message: 'Phone number is invalid' })
	phone: string;

	@ApiProperty({ example: '123456', description: '6-digit OTP' })
	@IsString()
	@IsNotEmpty()
	@Matches(OTP_CODE_REGEX, { message: 'OTP must be 6 digits' })
	otp: string;
}
