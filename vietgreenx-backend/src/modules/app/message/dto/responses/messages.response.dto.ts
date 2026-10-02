import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { MessageResponseDto } from './message.response.dto';

export class MessagesResponseDto {
	@ApiProperty({ type: [MessageResponseDto] })
	@Expose()
	@Type(() => MessageResponseDto)
	items: MessageResponseDto[];

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
