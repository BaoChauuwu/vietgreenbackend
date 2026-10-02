import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, Max, MaxLength, Min } from 'class-validator';

export class CreateCertUploadUrlRequestDto {
	@ApiProperty({ example: 'certificate.pdf' })
	@IsString()
	@MaxLength(255)
	fileName: string;

	@ApiProperty({ example: 'application/pdf' })
	@IsString()
	@MaxLength(100)
	mimeType: string;

	@ApiProperty({
		example: 2048000,
		description: 'File size in bytes (max 10MB)',
	})
	@IsInt()
	@Min(1)
	@Max(10 * 1024 * 1024)
	fileSize: number;
}
