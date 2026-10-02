import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';

export class PostAuthorResponseDto {
	@ApiProperty()
	@Expose()
	userId: string;

	@ApiProperty()
	@Expose()
	@Transform(({ obj }) => obj.displayName ?? '')
	displayName: string;

	@ApiProperty({ nullable: true })
	@Expose()
	@Transform(({ obj }) => obj.avatarMedia?.cdnUrl ?? null)
	avatarUrl: string | null;

	@ApiProperty({ default: false })
	@Expose()
	@Transform(({ obj }) => obj.isVerified ?? false)
	isVerified: boolean;
}
