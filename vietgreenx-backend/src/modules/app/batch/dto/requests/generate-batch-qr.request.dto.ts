import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min, Max } from 'class-validator';

export class GenerateBatchQrRequestDto {
	@ApiProperty({
		description: 'Number of QR codes to generate',
		example: 100,
		minimum: 1,
		maximum: 10000,
	})
	@IsInt()
	@Min(1)
	@Max(10000)
	amount: number;
}
