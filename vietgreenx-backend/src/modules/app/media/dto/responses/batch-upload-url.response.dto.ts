import { Exclude, Expose, Type } from 'class-transformer';
import { UploadUrlResponseDto } from './upload-url.response.dto';

@Exclude()
export class BatchUploadUrlResponseDto {
	@Expose()
	@Type(() => UploadUrlResponseDto)
	files: UploadUrlResponseDto[];
}
