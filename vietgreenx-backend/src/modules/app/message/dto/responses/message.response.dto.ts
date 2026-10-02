import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Transform, Type } from 'class-transformer';

export class MessageSenderResponseDto {
	@ApiProperty({ example: '019eab62-7e34-767a-b81a-98b10f113440' })
	@Expose()
	id: string;

	@ApiProperty({ example: 'John Doe' })
	@Expose()
	@Transform(({ obj }) => obj.profile?.displayName || '')
	displayName: string;

	@ApiPropertyOptional({ example: 'https://cdn.example.com/avatar.png', nullable: true })
	@Expose()
	@Transform(({ obj }) => obj.profile?.avatarMedia?.cdnUrl || null)
	avatarUrl: string | null;
}

export class MessageResponseDto {
	@ApiProperty({ example: '019eab62-7e34-767a-b81a-98b10f113440' })
	@Expose()
	id: string;

	@ApiProperty({ example: '019eab62-7e34-767a-b81a-98b10f113440' })
	@Expose()
	conversationId: string;

	@ApiProperty({ example: '019eab62-7e34-767a-b81a-98b10f113440' })
	@Expose()
	senderId: string;

	@ApiProperty({ type: MessageSenderResponseDto })
	@Expose()
	@Type(() => MessageSenderResponseDto)
	sender: MessageSenderResponseDto;

	@ApiPropertyOptional({ example: 'Hello, how are you?', nullable: true })
	@Expose()
	body: string | null;

	@ApiPropertyOptional({ example: '019eab62-7e34-767a-b81a-98b10f113440', nullable: true })
	@Expose()
	mediaId: string | null;

	@ApiProperty({ example: 'text' })
	@Expose()
	messageType: string;

	@ApiProperty({ example: {} })
	@Expose()
	metadata: Record<string, any>;

	@ApiProperty({ example: ['019eab62-7e34-767a-b81a-98b10f113440'] })
	@Expose()
	readBy: string[];

	@ApiProperty({ example: '2026-06-26T02:46:28.000Z' })
	@Expose()
	createdAt: Date;
}
