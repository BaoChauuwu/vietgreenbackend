import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
	IsIn,
	IsNotEmpty,
	IsOptional,
	IsString,
	Matches,
} from 'class-validator';
import { UserRole } from '@app/common/enums/user-role.enum';
import { REGISTERABLE_USER_ROLES } from '@app/common/constants/registerable-user-roles';

export class VerifyPhoneOtpRequestDto {
	@ApiProperty({ example: '0912345678' })
	@IsString()
	@IsNotEmpty()
	@Matches(/^(0|\+84)[3-9][0-9]{8}$/, { message: 'Phone number is invalid' })
	phone: string;

	@ApiProperty({ example: '123456', description: '6-digit OTP' })
	@IsString()
	@IsNotEmpty()
	@Matches(/^\d{6}$/, { message: 'OTP must be 6 digits' })
	otp: string;

	@ApiProperty({ example: 'Hieu Chau', description: 'Display name' })
	@IsString()
	@IsNotEmpty()
	displayName: string;

	@ApiProperty({
		example: '123qwe!@#',
		description:
			'Password must be at least 8 characters long, contain at least 1 letter and 1 number',
	})
	@IsString()
	@IsNotEmpty()
	@Matches(/^(?=.*[A-Za-z])(?=.*\d).{8,}$/, {
		message:
			'Password must be at least 8 characters long, contain at least 1 letter and 1 number',
	})
	password: string;

	@ApiPropertyOptional({
		enum: REGISTERABLE_USER_ROLES,
		example: UserRole.CONSUMER,
		default: UserRole.CONSUMER,
	})
	@IsOptional()
	@IsIn(REGISTERABLE_USER_ROLES)
	role?: UserRole;
}
