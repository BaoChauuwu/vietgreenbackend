import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsUUID } from 'class-validator';

export class ExportQrPdfRequestDto {
	@ApiProperty({
		description: 'List of QR token IDs to export (max 16)',
		type: [String],
	})
	@IsUUID('all', { each: true })
	tokenIds: string[];

	@ApiProperty({
		description: 'Number of labels per page: 4, 9, or 16',
		enum: [4, 9, 16],
	})
	@IsIn([4, 9, 16])
	layout: 4 | 9 | 16;
}
