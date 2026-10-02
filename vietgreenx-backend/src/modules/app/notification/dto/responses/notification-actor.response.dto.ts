import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';

export class NotificationActorResponseDto {
	@ApiProperty({
		description: 'Actor user ID',
		example: '019eab62-7e34-767a-b81a-98b10f113440',
	})
	@Expose()
	id: string;

	@ApiProperty({
		description: 'Actor username',
		example: 'john_doe',
	})
	@Expose()
	username: string;

	@ApiProperty({
		description: 'Actor display name',
		example: 'John Doe',
	})
	@Expose()
	@Transform(({ obj }) => obj.profile?.displayName ?? '')
	displayName: string;

	@ApiProperty({
		nullable: true,
		description: 'Actor avatar CDN URL',
		example: 'https://cdn.vietgreenx.com/avatars/john_doe.jpg',
	})
	@Expose()
	@Transform(({ obj }) => obj.profile?.avatarMedia?.cdnUrl ?? null)
	avatarUrl: string | null;
}
