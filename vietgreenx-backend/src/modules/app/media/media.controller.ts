import {
	Body,
	Controller,
	HttpCode,
	HttpStatus,
	MaxFileSizeValidator,
	Param,
	ParseFilePipe,
	ParseUUIDPipe,
	Post,
	UploadedFile,
	UseGuards,
	UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import {
	ApiBearerAuth,
	ApiBody,
	ApiConsumes,
	ApiOperation,
	ApiTags,
} from '@nestjs/swagger';
import { FileTypeValidator } from '@nestjs/common';
import { AppAuthGuard } from '@app/modules/app/app-auth/app-auth.guard';
import { CurrentUser } from '@app/common/decorators/current-user.decorator';
import { User } from '@app/database/typeorm/entities/identity/user.entity';
import { Responser } from '@app/common/decorators/responser.decorator';
import { toDto } from '@app/common/transformers/dto.transformer';
import { MediaUploadService } from './media-upload.service';
import { CreateUploadUrlRequestDto } from './dto/requests/create-upload-url.request.dto';
import { CreateBatchUploadUrlRequestDto } from './dto/requests/create-batch-upload-url.request.dto';
import { CompleteBatchUploadRequestDto } from './dto/requests/complete-batch-upload.request.dto';
import { UploadUrlResponseDto } from './dto/responses/upload-url.response.dto';
import { MediaCompleteResponseDto } from './dto/responses/media-complete.response.dto';
import { BatchUploadUrlResponseDto } from './dto/responses/batch-upload-url.response.dto';
import { CompleteBatchResponseDto } from './dto/responses/complete-batch.response.dto';

const IMAGE_MIME = /^image\/(png|jpe?g|webp)$/;

@ApiTags('App / Media')
@Controller('app/media')
export class MediaController {
	constructor(private readonly mediaUploadService: MediaUploadService) {}

	@Post('upload-url')
	@ApiBearerAuth()
	@UseGuards(AppAuthGuard)
	@ApiOperation({
		summary:
			'[AUTH] Request upload URL (S3 presigned PUT or local POST target)',
	})
	@Responser.handle('Create media upload URL')
	@HttpCode(HttpStatus.CREATED)
	async createUploadUrl(
		@CurrentUser() user: User,
		@Body() dto: CreateUploadUrlRequestDto,
	) {
		const result = await this.mediaUploadService.createUploadUrl(user, dto);
		return toDto(UploadUrlResponseDto, result);
	}

	@Post('batch-upload-url')
	@ApiBearerAuth()
	@UseGuards(AppAuthGuard)
	@ApiOperation({
		summary: '[AUTH] Request upload URLs for multiple files in one call',
	})
	@Responser.handle('Create batch media upload URLs')
	@HttpCode(HttpStatus.CREATED)
	async createBatchUploadUrl(
		@CurrentUser() user: User,
		@Body() dto: CreateBatchUploadUrlRequestDto,
	) {
		const results = await this.mediaUploadService.createBatchUploadUrl(
			user,
			dto,
		);
		return toDto(BatchUploadUrlResponseDto, { files: results });
	}

	@Post('complete-batch')
	@ApiBearerAuth()
	@UseGuards(AppAuthGuard)
	@ApiOperation({
		summary: '[AUTH] Confirm multiple uploads finished and mark all ready',
	})
	@Responser.handle('Complete batch media upload')
	@HttpCode(HttpStatus.OK)
	async completeBatch(
		@CurrentUser() user: User,
		@Body() dto: CompleteBatchUploadRequestDto,
	) {
		const results = await this.mediaUploadService.completeBatch(
			user,
			dto.mediaIds,
		);
		return toDto(CompleteBatchResponseDto, { files: results });
	}

	@Post(':id/complete')
	@ApiBearerAuth()
	@UseGuards(AppAuthGuard)
	@ApiOperation({
		summary: '[AUTH] Confirm upload finished and mark media ready',
	})
	@Responser.handle('Complete media upload')
	@HttpCode(HttpStatus.OK)
	async completeUpload(
		@CurrentUser() user: User,
		@Param('id', ParseUUIDPipe) id: string,
	) {
		const result = await this.mediaUploadService.completeUpload(user, id);
		return toDto(MediaCompleteResponseDto, result);
	}

	@Post(':id/upload')
	@ApiBearerAuth()
	@UseGuards(AppAuthGuard)
	@ApiOperation({
		summary:
			'[AUTH] Upload file directly (local dev only, when FILE_DRIVER=local)',
	})
	@ApiConsumes('multipart/form-data')
	@ApiBody({
		schema: {
			type: 'object',
			properties: {
				file: { type: 'string', format: 'binary' },
			},
		},
	})
	@Responser.handle('Upload media file locally')
	@HttpCode(HttpStatus.OK)
	@UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
	async uploadLocalFile(
		@CurrentUser() user: User,
		@Param('id', ParseUUIDPipe) id: string,
		@UploadedFile(
			new ParseFilePipe({
				validators: [
					new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
					new FileTypeValidator({
						fileType: IMAGE_MIME,
						fallbackToMimetype: true,
					}),
				],
			}),
		)
		file: Express.Multer.File,
	) {
		const result = await this.mediaUploadService.uploadLocalFile(
			user,
			id,
			file,
		);
		return toDto(MediaCompleteResponseDto, result);
	}
}
