import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class CreateBlockRequestDto {
	@ApiProperty({ description: 'ID of the user to block' })
	@IsNotEmpty()
	@IsUUID()
	blockedUserId: string;
}
