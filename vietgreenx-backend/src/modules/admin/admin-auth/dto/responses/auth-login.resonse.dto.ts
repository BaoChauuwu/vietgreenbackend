import { AdminProfileResponseDto } from '../../../admin-profile/dto/responses/admin-profile.response.dto';
import { Exclude, Expose, Type } from 'class-transformer';

@Exclude()
export class AuthLoginResponseDto {
	// Full login — returned when 2FA is not enabled
	@Expose()
	accessToken?: string;

	@Expose()
	expiredIn?: number;

	@Expose()
	@Type(() => AdminProfileResponseDto)
	profile?: AdminProfileResponseDto;

	// 2FA required — returned when admin has 2FA enabled
	@Expose()
	requiresTwoFactor?: boolean;

	@Expose()
	tempToken?: string;
}
