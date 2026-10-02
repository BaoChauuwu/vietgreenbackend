import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { ConversationResponseDto } from './conversation.response.dto';

export class ConversationsResponseDto {
	@ApiProperty({ type: [ConversationResponseDto] })
	@Expose()
	@Type(() => ConversationResponseDto)
	items: ConversationResponseDto[];

	@ApiProperty({ nullable: true, example: null })
	@Expose()
	nextCursor: string | null;

	@ApiProperty({ example: true })
	@Expose()
	hasNext: boolean;

	@ApiProperty({ example: 20 })
	@Expose()
	limit: number;
}
