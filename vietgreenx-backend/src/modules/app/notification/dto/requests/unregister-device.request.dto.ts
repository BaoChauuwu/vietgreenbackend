import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UnregisterDeviceRequestDto {
	@ApiProperty({ example: 'fcm-token-string' })
	@IsNotEmpty()
	@IsString()
	fcmToken: string;
}
