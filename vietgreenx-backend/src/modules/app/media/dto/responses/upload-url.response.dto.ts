import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class UploadUrlResponseDto {
	@ApiProperty()
	@Expose()
	mediaId: string;

	@ApiProperty({
		description: 'URL for uploading the file (PUT to S3, POST for local dev)',
	})
	@Expose()
	uploadUrl: string;

	@ApiProperty({ example: 'PUT', enum: ['PUT', 'POST'] })
	@Expose()
	uploadMethod: 'PUT' | 'POST';

	@ApiProperty({
		required: false,
		description: 'Multipart field name when uploadMethod is POST (local dev)',
	})
	@Expose()
	uploadField?: string;

	@ApiProperty({ example: 900 })
	@Expose()
	expiresIn: number;

	@ApiProperty()
	@Expose()
	cdnUrl: string;

	@ApiProperty({ example: 'image/jpeg' })
	@Expose()
	mimeType: string;
}
