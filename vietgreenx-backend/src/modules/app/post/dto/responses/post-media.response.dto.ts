import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class PostMediaResponseDto {
	@ApiProperty()
	@Expose()
	id: string;

	@ApiProperty()
	@Expose()
	cdnUrl: string;

	@ApiProperty()
	@Expose()
	mimeType: string;

	@ApiProperty()
	@Expose()
	position: number;

	@ApiProperty({ nullable: true })
	@Expose()
	widthPx: number | null;

	@ApiProperty({ nullable: true })
	@Expose()
	heightPx: number | null;
}
