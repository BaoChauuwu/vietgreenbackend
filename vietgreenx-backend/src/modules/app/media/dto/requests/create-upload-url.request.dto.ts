import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsString, MaxLength, Min } from 'class-validator';
import { MediaPurpose } from '@app/common/enums/media-purpose.enum';

export class CreateUploadUrlRequestDto {
	@ApiProperty({ enum: MediaPurpose, example: MediaPurpose.POST_IMAGE })
	@IsEnum(MediaPurpose)
	purpose: MediaPurpose;

	@ApiProperty({ example: 'photo.jpg' })
	@IsString()
	@MaxLength(255)
	fileName: string;

	@ApiProperty({ example: 'image/jpeg' })
	@IsString()
	@MaxLength(100)
	mimeType: string;

	@ApiProperty({ example: 204800, description: 'File size in bytes' })
	@IsInt()
	@Min(1)
	fileSize: number;
}
