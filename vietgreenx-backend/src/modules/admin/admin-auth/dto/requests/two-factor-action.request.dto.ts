import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Length, Matches } from 'class-validator';
import { OTP_CODE_REGEX } from '@app/common/utils/normalize-vietnamese-phone';

export class TwoFactorActionRequestDto {
	@ApiPropertyOptional({
		description: 'TOTP 6-digit code from authenticator app',
		example: '123456',
	})
	@IsOptional()
	@IsString()
	@Length(6, 6)
	@Matches(OTP_CODE_REGEX, { message: 'code must be a 6-digit number' })
	code?: string;

	@ApiPropertyOptional({
		description: 'One-time backup code',
		example: 'ab12cd34',
	})
	@IsOptional()
	@IsString()
	@Length(8, 8)
	@Matches(/^[0-9a-f]{8}$/, {
		message: 'backupCode must be an 8-character hex string',
	})
	backupCode?: string;
}
