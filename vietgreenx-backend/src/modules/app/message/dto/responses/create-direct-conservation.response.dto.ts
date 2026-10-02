import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class CreateDirectConversationResponseDto {
	@ApiProperty({
		description: 'The UUID of the conversation',
		example: '019eab62-7e34-767a-b81a-98b10f113440',
	})
	@Expose()
	id: string;

	@ApiProperty({
		description: 'The type of conversation (direct or group)',
		example: 'direct',
	})
	@Expose()
	conversationType: string;

	@ApiProperty({ example: '2026-06-24T08:46:28.000Z' })
	@Expose()
	createdAt: Date;

	@ApiProperty({ example: '2026-06-24T08:46:28.000Z' })
	@Expose()
	updatedAt: Date;
}
