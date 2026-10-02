import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class AdminForgotPasswordResponseDto {
	@Expose()
	message: string;
}
