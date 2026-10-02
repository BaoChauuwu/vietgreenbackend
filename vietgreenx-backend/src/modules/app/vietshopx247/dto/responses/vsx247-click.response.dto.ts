import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class Vsx247ClickResponseDto {
	@Expose()
	postId: string;

	@Expose()
	tracked: boolean;
}
