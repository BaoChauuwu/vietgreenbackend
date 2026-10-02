import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class AuthTokenResponseDto {
	@ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
	@Expose()
	accessToken: string;

	@ApiProperty({ example: 900000, description: 'Access token TTL (ms)' })
	@Expose()
	accessTokenExpires: number;

	@ApiProperty({ example: 'refresh-token-uuid-string' })
	@Expose()
	refreshToken: string;

	@ApiProperty({ example: 2592000000, description: 'Refresh token TTL (ms)' })
	@Expose()
	refreshTokenExpires: number;

	@ApiProperty({ example: 'consumer' })
	@Expose()
	role: string;

	@ApiProperty({ example: 'uuid-user-id' })
	@Expose()
	userId: string;
}
