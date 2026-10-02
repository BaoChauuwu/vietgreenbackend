import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class RatingBreakdownResponseDto {
	@ApiProperty({ example: 5 })
	@Expose()
	'1': number;

	@ApiProperty({ example: 3 })
	@Expose()
	'2': number;

	@ApiProperty({ example: 10 })
	@Expose()
	'3': number;

	@ApiProperty({ example: 20 })
	@Expose()
	'4': number;

	@ApiProperty({ example: 42 })
	@Expose()
	'5': number;
}
