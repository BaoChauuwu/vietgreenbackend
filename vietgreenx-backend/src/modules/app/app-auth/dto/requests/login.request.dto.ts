import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class LoginRequestDto {
	@ApiProperty({
		example: '0912345678 or user@example.com',
		description: 'Phone or email',
	})
	@IsString()
	@IsNotEmpty()
	identifier: string;

	@ApiProperty({ example: '123qwe!@#' })
	@IsString()
	@IsNotEmpty()
	password: string;

	@ApiPropertyOptional({ example: 'fcm-token-from-device' })
	@IsString()
	@IsOptional()
	fcmToken?: string;

	@ApiPropertyOptional({ example: 'android' })
	@IsString()
	@IsOptional()
	platform?: string;

	@ApiPropertyOptional({ example: 'Samsung Galaxy S24' })
	@IsString()
	@IsOptional()
	deviceName?: string;

	@ApiPropertyOptional({ example: 'device-unique-id-123' })
	@IsString()
	@IsOptional()
	deviceId?: string;
}
