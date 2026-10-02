import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class MediaCompleteResponseDto {
	@ApiProperty()
	@Expose()
	id: string;

	@ApiProperty()
	@Expose()
	cdnUrl: string;

	@ApiProperty()
	@Expose()
	mimeType: string;

	@ApiProperty({ example: 'ready' })
	@Expose()
	processingStatus: string;
}
