import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class TwoFactorSetupResponseDto {
	@Expose()
	secret: string;

	@Expose()
	otpauthUrl: string;
}
