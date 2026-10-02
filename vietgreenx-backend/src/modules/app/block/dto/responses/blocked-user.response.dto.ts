import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';

export class BlockedUserResponseDto {
	@ApiProperty()
	@Expose()
	id: string;

	@ApiProperty()
	@Expose()
	username: string;

	@ApiPropertyOptional()
	@Expose()
	@Transform(({ obj }) => obj.profile?.displayName ?? null)
	displayName: string | null;

	@ApiPropertyOptional()
	@Expose()
	@Transform(({ obj }) => obj.profile?.avatarMedia?.cdnUrl ?? null)
	avatarUrl: string | null;
}
