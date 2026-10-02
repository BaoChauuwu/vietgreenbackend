import { ApiProperty } from '@nestjs/swagger';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsUUID } from 'class-validator';

export class CompleteBatchUploadRequestDto {
	@ApiProperty({ type: [String], example: ['uuid1', 'uuid2'] })
	@IsArray()
	@ArrayMinSize(1)
	@ArrayMaxSize(20)
	@IsUUID('all', { each: true })
	mediaIds: string[];
}
