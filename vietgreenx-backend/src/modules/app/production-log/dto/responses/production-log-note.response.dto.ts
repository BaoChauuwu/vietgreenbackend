import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class ProductionLogNoteResponseDto {
	@Expose()
	@ApiProperty()
	id: string;

	@Expose()
	@ApiProperty()
	logId: string;

	@Expose()
	@ApiProperty()
	createdBy: string;

	@Expose()
	@ApiProperty()
	noteBody: string;

	@Expose()
	@ApiProperty()
	createdAt: Date;
}
