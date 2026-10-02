import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class LogoutRequestDto {
	@ApiProperty({ example: 'refresh-token-string' })
	@IsString()
	@IsNotEmpty()
	refreshToken: string;
}
