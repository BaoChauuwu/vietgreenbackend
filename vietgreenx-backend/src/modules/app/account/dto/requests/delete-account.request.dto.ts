import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class DeleteAccountRequestDto {
	@ApiProperty({ example: '123qwe!@#' })
	@IsNotEmpty()
	@IsString()
	currentPassword: string;
}
