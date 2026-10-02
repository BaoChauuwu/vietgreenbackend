import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsObject, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateMessageRequestDto {
	@ApiPropertyOptional({
		description: 'The text content of the message',
		example: 'Hello, how are you?',
	})
	@IsOptional()
	@IsString()
	body?: string;

	@ApiPropertyOptional({
		description: 'The media file ID associated with the message (e.g. for image messages)',
		example: '019eab62-7e34-767a-b81a-98b10f113440',
	})
	@IsOptional()
	@IsUUID()
	mediaId?: string;

	@ApiPropertyOptional({
		description: 'The type of the message (text, image, product_card, system)',
		example: 'text',
	})
	@IsOptional()
	@IsString()
	messageType?: string = 'text';

	@ApiPropertyOptional({
		description: 'Additional structured metadata for the message',
		example: {},
	})
	@IsOptional()
	@IsObject()
	metadata?: Record<string, any>;
}
