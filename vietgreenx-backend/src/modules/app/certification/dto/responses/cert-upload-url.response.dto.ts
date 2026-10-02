import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class CertUploadUrlResponseDto {
	@ApiProperty({
		description: 'Key used to save into documentUrl column during CRUD',
	})
	@Expose()
	storageKey: string;

	@ApiProperty({ description: 'URL for client to perform file upload' })
	@Expose()
	uploadUrl: string;

	@ApiProperty({
		example: 'PUT',
		description: 'HTTP method for upload (PUT/POST)',
	})
	@Expose()
	uploadMethod: string;

	@ApiPropertyOptional({
		description: 'File field name when method is POST',
	})
	@Expose()
	uploadField?: string;
}
