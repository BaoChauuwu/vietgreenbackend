import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

export class ConversationPartnerResponseDto {
	@ApiProperty({ example: '019eab62-7e34-767a-b81a-98b10f113440' })
	@Expose()
	id: string;

	@ApiProperty({ example: 'John Doe' })
	@Expose()
	displayName: string;

	@ApiPropertyOptional({
		example: 'https://cdn.example.com/avatar.png',
		nullable: true,
	})
	@Expose()
	avatarUrl: string | null;
}

export class LastMessageResponseDto {
	@ApiPropertyOptional({ nullable: true, example: 'ok đợt A đi bạn ơi' })
	@Expose()
	body: string | null;

	@ApiProperty({ example: '019eab62-7e34-767a-b81a-98b10f113440' })
	@Expose()
	senderId: string;

	@ApiProperty({
		example: 'text',
		enum: ['text', 'image', 'product_card', 'system'],
	})
	@Expose()
	messageType: string;

	@ApiProperty({ example: '2026-07-18T08:46:28.000Z' })
	@Expose()
	createdAt: Date;
}

export class ConversationResponseDto {
	@ApiProperty({ example: '019eab62-7e34-767a-b81a-98b10f113440' })
	@Expose()
	id: string;

	@ApiProperty({ example: 'direct' })
	@Expose()
	conversationType: string;

	@ApiPropertyOptional({ example: 'My Group Chat', nullable: true })
	@Expose()
	name: string | null;

	@ApiPropertyOptional({ example: '2026-06-24T08:46:28.000Z', nullable: true })
	@Expose()
	lastMessageAt: Date | null;

	@ApiProperty({ type: ConversationPartnerResponseDto, nullable: true })
	@Expose()
	@Type(() => ConversationPartnerResponseDto)
	partner: ConversationPartnerResponseDto | null;

	@ApiPropertyOptional({ type: LastMessageResponseDto, nullable: true })
	@Expose()
	@Type(() => LastMessageResponseDto)
	lastMessage: LastMessageResponseDto | null;

	@ApiProperty({ example: 3 })
	@Expose()
	unreadCount: number;

	@ApiProperty({ example: '2026-06-24T08:46:28.000Z' })
	@Expose()
	createdAt: Date;

	@ApiProperty({ example: '2026-06-24T08:46:28.000Z' })
	@Expose()
	updatedAt: Date;
}
