import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { NotifType } from '@app/common/enums/notif-type.enum';
import { NotificationActorResponseDto } from './notification-actor.response.dto';

export class NotificationResponseDto {
	@ApiProperty({
		description: 'Notification ID',
		example: '019eab62-7e34-767a-b81a-98b10f113440',
	})
	@Expose()
	id: string;

	@ApiProperty({
		description: 'Recipient user ID',
		example: '019eab62-7e34-767a-b81a-98b10f113440',
	})
	@Expose()
	recipientId: string;

	@ApiPropertyOptional({
		type: NotificationActorResponseDto,
		nullable: true,
		description:
			'The actor who performed the action that triggered the notification (null for system notifications)',
	})
	@Expose()
	@Type(() => NotificationActorResponseDto)
	actor: NotificationActorResponseDto | null;

	@ApiProperty({
		enum: NotifType,
		description: 'Type of notification',
		example: NotifType.MENTION,
	})
	@Expose()
	notifType: NotifType;

	@ApiPropertyOptional({
		nullable: true,
		description: 'Type of related entity',
		example: 'comment',
	})
	@Expose()
	entityType: string | null;

	@ApiPropertyOptional({
		nullable: true,
		description: 'ID of related entity',
		example: '019eab62-7e34-767a-b81a-98b10f113440',
	})
	@Expose()
	entityId: string | null;

	@ApiProperty({
		description: 'Notification title',
		example: '@john_doe mentioned you in a comment',
	})
	@Expose()
	title: string;

	@ApiPropertyOptional({
		nullable: true,
		description: 'Notification body text/preview',
		example: 'Hello world, check this out!',
	})
	@Expose()
	body: string | null;

	@ApiPropertyOptional({
		nullable: true,
		description: 'Deep link to open in frontend',
		example: '/posts/019eab62-7e34-767a-b81a-98b10f113440',
	})
	@Expose()
	deepLink: string | null;

	@ApiProperty({
		description: 'Read status of notification',
		example: false,
	})
	@Expose()
	isRead: boolean;

	@ApiPropertyOptional({
		nullable: true,
		description: 'Timestamp when notification was read',
		example: '2026-06-22T04:29:12.000Z',
	})
	@Expose()
	readAt: Date | null;

	@ApiProperty({
		description: 'Notification creation timestamp',
		example: '2026-06-22T04:25:00.000Z',
	})
	@Expose()
	createdAt: Date;
}
