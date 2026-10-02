import { ApiProperty } from '@nestjs/swagger';
import {
	ArrayMaxSize,
	ArrayMinSize,
	IsArray,
	ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateUploadUrlRequestDto } from './create-upload-url.request.dto';

export class CreateBatchUploadUrlRequestDto {
	@ApiProperty({ type: [CreateUploadUrlRequestDto] })
	@IsArray()
	@ArrayMinSize(1)
	@ArrayMaxSize(20)
	@ValidateNested({ each: true })
	@Type(() => CreateUploadUrlRequestDto)
	files: CreateUploadUrlRequestDto[];
}
