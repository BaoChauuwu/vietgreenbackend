import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class DashboardStatsResponseDto {
	@ApiProperty()
	@Expose()
	totalUsers: number;

	@ApiProperty()
	@Expose()
	newUsersToday: number;

	@ApiProperty()
	@Expose()
	totalPosts: number;

	@ApiProperty()
	@Expose()
	totalProducts: number;

	@ApiProperty()
	@Expose()
	totalQrGenerated: number;

	@ApiProperty()
	@Expose()
	totalQrScans: number;
}
