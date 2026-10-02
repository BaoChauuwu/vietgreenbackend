import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshTokenRequestDto {
	@ApiProperty({ example: 'refresh-token-string' })
	@IsString()
	@IsNotEmpty()
	refreshToken: string;
}
