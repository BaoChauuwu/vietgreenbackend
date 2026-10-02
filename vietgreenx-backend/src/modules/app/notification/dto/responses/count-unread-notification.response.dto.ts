import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsNumber } from 'class-validator';

export class CountUnReadNotificationResponse {
	@ApiProperty({
		description: 'Total unread notification',
	})
	@Expose()
	@IsNumber()
	count: number;
}
