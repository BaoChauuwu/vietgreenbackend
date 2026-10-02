import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class CreateDirectConversationRequestDto {
	@ApiProperty({
		description: 'The Id of user you want to direct message',
		example: '019eab62-7e34-767a-b81a-98b10f113440',
	})
	@IsNotEmpty()
	@IsUUID()
	targetUserId: string;
}
