import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateProductionLogNoteRequestDto {
	@ApiProperty({ description: 'The note body to append to the log' })
	@IsNotEmpty()
	@IsString()
	noteBody: string;
}
