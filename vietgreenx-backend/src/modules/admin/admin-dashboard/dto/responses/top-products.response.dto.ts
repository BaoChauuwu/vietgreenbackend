import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class TopProductResponseDto {
	@ApiProperty()
	@Expose()
	productId: string;

	@ApiProperty()
	@Expose()
	name: string;

	@ApiProperty()
	@Expose()
	totalScans: number;
}
