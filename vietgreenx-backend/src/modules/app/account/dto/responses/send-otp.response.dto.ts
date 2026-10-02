import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class SendOtpResponseDto {
	@Expose()
	devOtp?: string;
}
