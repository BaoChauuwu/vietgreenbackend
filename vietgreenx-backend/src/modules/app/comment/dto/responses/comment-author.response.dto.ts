import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';

export class CommentAuthorResponseDto {
	@ApiProperty()
	@Expose()
	@Transform(({ obj }) => obj.id ?? obj.userId)
	userId: string;

	@ApiProperty()
	@Expose()
	@Transform(({ obj }) => obj.profile?.displayName ?? obj.displayName ?? '')
	displayName: string;

	@ApiProperty({ nullable: true })
	@Expose()
	@Transform(
		({ obj }) =>
			obj.profile?.avatarMedia?.cdnUrl ?? obj.avatarMedia?.cdnUrl ?? null,
	)
	avatarUrl: string | null;
}
