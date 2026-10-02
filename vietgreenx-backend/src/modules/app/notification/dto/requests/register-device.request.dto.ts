import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class RegisterDeviceRequestDto {
	@ApiProperty({ example: 'fcm-token-string' })
	@IsNotEmpty()
	@IsString()
	fcmToken: string;

	@ApiPropertyOptional({ example: 'android', enum: ['android', 'ios', 'web'] })
	@IsOptional()
	@IsString()
	platform?: string;
}
