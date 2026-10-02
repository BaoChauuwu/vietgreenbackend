import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length, Matches } from 'class-validator';
import { OTP_CODE_REGEX } from '@app/common/utils/normalize-vietnamese-phone';

export class TwoFactorCodeRequestDto {
	@ApiProperty({
		description: 'TOTP 6-digit code from authenticator app',
		example: '123456',
	})
	@IsString()
	@Length(6, 6)
	@Matches(OTP_CODE_REGEX, { message: 'code must be a 6-digit number' })
	code: string;
}
