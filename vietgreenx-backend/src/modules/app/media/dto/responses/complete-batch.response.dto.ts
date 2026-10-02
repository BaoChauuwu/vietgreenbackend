import { Exclude, Expose, Type } from 'class-transformer';
import { MediaCompleteResponseDto } from './media-complete.response.dto';

@Exclude()
export class CompleteBatchResponseDto {
	@Expose()
	@Type(() => MediaCompleteResponseDto)
	files: MediaCompleteResponseDto[];
}
