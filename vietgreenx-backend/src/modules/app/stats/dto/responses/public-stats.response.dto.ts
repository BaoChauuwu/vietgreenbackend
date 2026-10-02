import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class PublicStatsResponseDto {
	@ApiProperty({
		example: 100,
		description: 'Number of active users',
		type: Number,
	})
	@Expose()
	userCount: number;

	@ApiProperty({
		example: 1000,
		description: 'Total number of QR scans',
		type: Number,
	})
	@Expose()
	qrScanCount: number;
}
