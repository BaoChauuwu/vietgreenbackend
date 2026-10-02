import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class CertUploadResponseDto {
	@ApiProperty({ description: 'Storage key of the saved document file' })
	@Expose()
	storageKey: string;
}
