import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

export class TraceTokenItemDto {
	@Expose()
	@ApiProperty({ example: '01918a3d-...' })
	token: string;

	@Expose()
	@ApiProperty({ example: 'https://vietgreenx.com/trace/01918a3d-...' })
	traceUrl: string;
}

export class GenerateBatchQrResponseDto {
	@Expose()
	@ApiProperty({
		description: 'List of generated trace tokens/URLs',
		type: [TraceTokenItemDto],
	})
	@Type(() => TraceTokenItemDto)
	tokens: TraceTokenItemDto[];
}
