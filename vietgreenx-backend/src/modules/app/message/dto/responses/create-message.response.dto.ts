import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class CreateMessageResponseDto {
	@ApiProperty({ example: '019eab62-7e34-767a-b81a-98b10f113440' })
	@Expose()
	id: string;

	@ApiProperty({ example: '019eab62-7e34-767a-b81a-98b10f113440' })
	@Expose()
	conversationId: string;

	@ApiProperty({ example: '019eab62-7e34-767a-b81a-98b10f113440' })
	@Expose()
	senderId: string;

	@ApiPropertyOptional({
		description: 'The text content of the message',
		example: 'Hello, how are you?',
	})
	@Expose()
	body: string;

	@ApiPropertyOptional({
		description:
			'The media file ID associated with the message (e.g. for image messages)',
		example: '019eab62-7e34-767a-b81a-98b10f113440',
	})
	@Expose()
	mediaId: string;

	@ApiPropertyOptional({
		description: 'The type of the message (text, image, product_card, system)',
		example: 'text',
	})
	@Expose()
	messageType: string = 'text';

	@ApiPropertyOptional({
		description: 'Additional structured metadata for the message',
		example: {},
	})
	@Expose()
	metadata: Record<string, any>;

	@ApiProperty({ example: '2026-06-26T02:46:28.000Z' })
	@Expose()
	createdAt: Date;
}
