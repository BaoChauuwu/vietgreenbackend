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

export class VerifyEmailTokenRequestDto {
	@ApiProperty({ example: 'uuid-token-here' })
	@IsString()
	@IsNotEmpty()
	token: string;

	@ApiProperty({ example: 'Hieu Chau' })
	@IsString()
	@IsNotEmpty()
	displayName: string;

	@ApiProperty({ example: '123qwe!@#' })
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
