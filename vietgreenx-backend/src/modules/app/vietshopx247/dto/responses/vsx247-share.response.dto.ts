import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class Vsx247ShareResponseDto {
	@Expose()
	postId: string;

	@Expose()
	authorId: string;

	@Expose()
	source: string;

	@Expose()
	externalUrl: string;

	@Expose()
	sourceMetadata: Record<string, unknown>;

	@Expose()
	createdAt: Date;
}
