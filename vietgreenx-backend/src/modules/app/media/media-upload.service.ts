import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { MediaPurpose } from '@app/common/enums/media-purpose.enum';
import { HttpBadRequestError } from '@app/common/errors/bad-request.error';
import { HttpForbiddenError } from '@app/common/errors/forbidden.error';
import { HttpNotFoundError } from '@app/common/errors/not-found.error';
import { ErrorCode } from '@app/common/errors/error-code';
import { FileDriver } from '@app/config/file.config';
import { MediaRepository } from '@app/database/typeorm/repositories/media.repository';
import { User } from '@app/database/typeorm/entities/identity/user.entity';
import { Media } from '@app/database/typeorm/entities/media/media.entity';
import { S3Service } from '@app/services/aws/s3/s3.service';
import { CreateUploadUrlRequestDto } from './dto/requests/create-upload-url.request.dto';
import { CreateBatchUploadUrlRequestDto } from './dto/requests/create-batch-upload-url.request.dto';
import { ConfigKeys } from '@app/config/config-key.enum';
import { MediaCompletedEvent } from './events/media-completed.event';
import {
	MEDIA_PROCESSING_QUEUE,
	MediaProcessingJobPayload,
} from './media-processing.queue';

export const MEDIA_UPLOAD_EXPIRES_SEC = 900;

const PURPOSE_RULES: Record<
	MediaPurpose,
	{ folder: string; mimePattern: RegExp; maxBytes: number }
> = {
	[MediaPurpose.POST_IMAGE]: {
		folder: 'posts',
		mimePattern: /^image\/(png|jpe?g|webp)$/,
		maxBytes: 5 * 1024 * 1024,
	},
	[MediaPurpose.AVATAR]: {
		folder: 'avatars',
		mimePattern: /^image\/(png|jpe?g|webp)$/,
		maxBytes: 5 * 1024 * 1024,
	},
	[MediaPurpose.COVER]: {
		folder: 'covers',
		mimePattern: /^image\/(png|jpe?g|webp)$/,
		maxBytes: 5 * 1024 * 1024,
	},
	[MediaPurpose.PRODUCTION_LOG_IMAGE]: {
		folder: 'production-logs',
		mimePattern: /^image\/(png|jpe?g|webp)$/,
		maxBytes: 5 * 1024 * 1024,
	},
	[MediaPurpose.PRODUCT_IMAGE]: {
		folder: 'products',
		mimePattern: /^image\/(png|jpe?g|webp)$/,
		maxBytes: 5 * 1024 * 1024,
	},
	[MediaPurpose.GREEN_PROFILE_PHOTO]: {
		folder: 'green-profiles',
		mimePattern: /^image\/(png|jpe?g|webp)$/,
		maxBytes: 5 * 1024 * 1024,
	},
	[MediaPurpose.GREEN_PROFILE_VIDEO]: {
		folder: 'green-profiles',
		mimePattern: /^video\/(mp4|quicktime|x-msvideo|webm)$/,
		maxBytes: 100 * 1024 * 1024,
	},
};

export interface UploadUrlResult {
	mediaId: string;
	uploadUrl: string;
	uploadMethod: 'PUT' | 'POST';
	uploadField?: string;
	expiresIn: number;
	cdnUrl: string;
	mimeType: string;
}

@Injectable()
export class MediaUploadService {
	private readonly logger = new Logger(MediaUploadService.name);
	constructor(
		private readonly mediaRepository: MediaRepository,
		private readonly s3Service: S3Service,
		private readonly configService: ConfigService,
		private readonly eventEmitter: EventEmitter2,
		@InjectQueue(MEDIA_PROCESSING_QUEUE)
		private readonly processingQueue: Queue<MediaProcessingJobPayload>,
	) {}

	async createUploadUrl(
		user: User,
		dto: CreateUploadUrlRequestDto,
	): Promise<UploadUrlResult> {
		const rules = PURPOSE_RULES[dto.purpose];
		if (!rules) {
			throw new HttpBadRequestError(ErrorCode.MEDIA_INVALID_PURPOSE);
		}

		if (!rules.mimePattern.test(dto.mimeType)) {
			throw new HttpBadRequestError(ErrorCode.MEDIA_INVALID_TYPE);
		}

		if (dto.fileSize > rules.maxBytes) {
			throw new HttpBadRequestError(ErrorCode.MEDIA_FILE_TOO_LARGE);
		}

		const storageKey = this.buildStorageKey(
			rules.folder,
			user.id,
			dto.fileName,
		);
		const cdnUrl = this.buildCdnUrl(storageKey);

		const media = await this.mediaRepository.create({
			uploaderId: user.id,
			mediaType: dto.mimeType.startsWith('video/') ? 'video' : 'image',
			storageKey,
			cdnUrl,
			mimeType: dto.mimeType,
			fileSizeBytes: dto.fileSize,
			processingStatus: 'pending',
		});

		const fileDriver = this.getFileDriver();

		if (
			fileDriver === FileDriver.S3 ||
			fileDriver === FileDriver.S3_PRESIGNED
		) {
			const uploadUrl = await this.s3Service.getPresignedUploadUrl(
				storageKey,
				dto.mimeType,
				MEDIA_UPLOAD_EXPIRES_SEC,
			);

			return {
				mediaId: media.id,
				uploadUrl,
				uploadMethod: 'PUT',
				expiresIn: MEDIA_UPLOAD_EXPIRES_SEC,
				cdnUrl,
				mimeType: dto.mimeType,
			};
		}

		const apiPrefix = this.configService.getOrThrow(ConfigKeys.API_PREFIX, {
			infer: true,
		});

		return {
			mediaId: media.id,
			uploadUrl: `/${apiPrefix}/app/media/${media.id}/upload`,
			uploadMethod: 'POST',
			uploadField: 'file',
			expiresIn: MEDIA_UPLOAD_EXPIRES_SEC,
			cdnUrl,
			mimeType: dto.mimeType,
		};
	}

	async createBatchUploadUrl(
		user: User,
		dto: CreateBatchUploadUrlRequestDto,
	): Promise<UploadUrlResult[]> {
		return Promise.all(
			dto.files.map((file) => this.createUploadUrl(user, file)),
		);
	}

	async completeBatch(
		user: User,
		mediaIds: string[],
	): Promise<
		{ id: string; cdnUrl: string; mimeType: string; processingStatus: string }[]
	> {
		return Promise.all(mediaIds.map((id) => this.completeUpload(user, id)));
	}

	async uploadLocalFile(
		user: User,
		mediaId: string,
		file: Express.Multer.File,
	): Promise<{
		id: string;
		cdnUrl: string;
		mimeType: string;
		processingStatus: string;
	}> {
		if (this.getFileDriver() !== FileDriver.LOCAL) {
			throw new HttpBadRequestError(ErrorCode.MEDIA_LOCAL_UPLOAD_ONLY);
		}

		const media = await this.getOwnedPendingMedia(user.id, mediaId);

		if (
			!PURPOSE_RULES[this.inferPurposeFromKey(media)].mimePattern.test(
				file.mimetype,
			)
		) {
			throw new HttpBadRequestError(ErrorCode.MEDIA_INVALID_TYPE);
		}

		const localPath = this.getLocalFilePath(media.storageKey);
		await fs.promises.mkdir(path.dirname(localPath), { recursive: true });
		await fs.promises.writeFile(localPath, file.buffer);

		return this.completeUpload(user, mediaId);
	}

	async completeUpload(
		user: User,
		mediaId: string,
	): Promise<{
		id: string;
		cdnUrl: string;
		mimeType: string;
		processingStatus: string;
	}> {
		const media = await this.getOwnedPendingMedia(user.id, mediaId);
		const actualSize = await this.assertFileInStorage(media);

		const updated = await this.mediaRepository.update(media.id, {
			processingStatus: 'ready',
			fileSizeBytes: actualSize,
		});

		this.eventEmitter.emit(
			'media.completed',
			new MediaCompletedEvent(updated!),
		);

		if (updated!.mediaType === 'image') {
			try {
				await this.processingQueue.add('process-image', {
					mediaId: updated!.id,
					storageKey: updated!.storageKey,
				});
			} catch (err) {
				this.logger.error(
					`Failed to enqueue image processing for media ${updated!.id}: ${(err as Error).message}`,
				);
			}
		}

		return {
			id: updated!.id,
			cdnUrl: updated!.cdnUrl,
			mimeType: updated!.mimeType,
			processingStatus: updated!.processingStatus,
		};
	}

	assertMediaReadyForPost(media: Media, userId: string): void {
		this.assertOwnedReadyMedia(media, userId);
		if (!media.storageKey.startsWith('posts/')) {
			throw new HttpBadRequestError(ErrorCode.MEDIA_INVALID_FOR_POST);
		}
		if (media.mediaType !== 'image') {
			throw new HttpBadRequestError(ErrorCode.POST_MEDIA_INVALID_TYPE);
		}
	}

	assertMediaReadyForAvatar(media: Media, userId: string): void {
		this.assertOwnedReadyMedia(media, userId);
		if (!media.storageKey.startsWith('avatars/')) {
			throw new HttpBadRequestError(ErrorCode.MEDIA_INVALID_FOR_AVATAR);
		}
		if (media.mediaType !== 'image') {
			throw new HttpBadRequestError(ErrorCode.MEDIA_INVALID_TYPE);
		}
	}

	assertMediaReadyForCover(media: Media, userId: string): void {
		this.assertOwnedReadyMedia(media, userId);
		if (!media.storageKey.startsWith('covers/')) {
			throw new HttpBadRequestError(ErrorCode.MEDIA_INVALID_FOR_COVER);
		}
		if (media.mediaType !== 'image') {
			throw new HttpBadRequestError(ErrorCode.MEDIA_INVALID_TYPE);
		}
	}

	assertMediaReadyForProductionLog(media: Media, userId: string): void {
		this.assertOwnedReadyMedia(media, userId);
		if (!media.storageKey.startsWith('production-logs/')) {
			throw new HttpBadRequestError(ErrorCode.MEDIA_INVALID_FOR_PRODUCTION_LOG);
		}
		if (media.mediaType !== 'image') {
			throw new HttpBadRequestError(ErrorCode.MEDIA_INVALID_TYPE);
		}
	}

	assertMediaReadyForProduct(media: Media, userId: string): void {
		this.assertOwnedReadyMedia(media, userId);
		if (!media.storageKey.startsWith('products/')) {
			throw new HttpBadRequestError(ErrorCode.MEDIA_INVALID_FOR_PRODUCT);
		}
		if (media.mediaType !== 'image') {
			throw new HttpBadRequestError(ErrorCode.MEDIA_INVALID_TYPE);
		}
	}

	assertMediaReadyForGreenProfilePhoto(
		media: Media,
		userId: string,
		allowedUploaderIds?: string[],
	): void {
		this.assertOwnedReadyMedia(media, userId, allowedUploaderIds);
		if (!media.storageKey.startsWith('green-profiles/')) {
			throw new HttpBadRequestError(
				ErrorCode.MEDIA_INVALID_FOR_GREEN_PROFILE_PHOTO,
			);
		}
		if (media.mediaType !== 'image') {
			throw new HttpBadRequestError(ErrorCode.MEDIA_INVALID_TYPE);
		}
	}

	assertMediaReadyForGreenProfileVideo(
		media: Media,
		userId: string,
		allowedUploaderIds?: string[],
	): void {
		this.assertOwnedReadyMedia(media, userId, allowedUploaderIds);
		if (!media.storageKey.startsWith('green-profiles/')) {
			throw new HttpBadRequestError(
				ErrorCode.MEDIA_INVALID_FOR_GREEN_PROFILE_VIDEO,
			);
		}
		if (media.mediaType !== 'video') {
			throw new HttpBadRequestError(ErrorCode.MEDIA_INVALID_TYPE);
		}
	}

	private assertOwnedReadyMedia(
		media: Media,
		userId: string,
		allowedUploaderIds?: string[],
	): void {
		const uploaderIds = allowedUploaderIds ?? [userId];
		if (!uploaderIds.includes(media.uploaderId)) {
			throw new HttpForbiddenError(ErrorCode.MEDIA_NOT_OWNED);
		}
		if (media.processingStatus !== 'ready') {
			throw new HttpBadRequestError(ErrorCode.MEDIA_NOT_READY);
		}
	}

	private async getOwnedPendingMedia(
		userId: string,
		mediaId: string,
	): Promise<Media> {
		const media = await this.mediaRepository.findOne({ id: mediaId });
		if (!media) {
			throw new HttpNotFoundError(ErrorCode.MEDIA_NOT_FOUND);
		}
		if (media.uploaderId !== userId) {
			throw new HttpForbiddenError(ErrorCode.MEDIA_NOT_OWNED);
		}
		if (media.processingStatus === 'ready') {
			throw new HttpBadRequestError(ErrorCode.MEDIA_ALREADY_READY);
		}
		return media;
	}

	private async assertFileInStorage(media: Media): Promise<number> {
		const fileDriver = this.getFileDriver();
		const rules = PURPOSE_RULES[this.inferPurposeFromKey(media)];

		if (
			fileDriver === FileDriver.S3 ||
			fileDriver === FileDriver.S3_PRESIGNED
		) {
			const head = await this.s3Service.headObject(media.storageKey);
			if (!head.exists || !head.contentLength) {
				throw new HttpBadRequestError(ErrorCode.MEDIA_UPLOAD_NOT_FOUND);
			}

			this.validateUploadedFile(
				head.contentLength,
				head.contentType,
				media.fileSizeBytes,
				rules,
			);
			return head.contentLength;
		}

		const localPath = this.getLocalFilePath(media.storageKey);
		if (!fs.existsSync(localPath)) {
			throw new HttpBadRequestError(ErrorCode.MEDIA_UPLOAD_NOT_FOUND);
		}

		const stats = await fs.promises.stat(localPath);
		this.validateUploadedFile(
			stats.size,
			media.mimeType,
			media.fileSizeBytes,
			rules,
		);
		return stats.size;
	}

	private validateUploadedFile(
		actualSize: number,
		contentType: string | undefined,
		declaredSize: number,
		rules: { mimePattern: RegExp; maxBytes: number },
	): void {
		if (actualSize <= 0) {
			throw new HttpBadRequestError(ErrorCode.MEDIA_UPLOAD_NOT_FOUND);
		}

		if (actualSize > declaredSize) {
			throw new HttpBadRequestError(ErrorCode.MEDIA_UPLOAD_SIZE_EXCEEDED);
		}

		if (actualSize > rules.maxBytes) {
			throw new HttpBadRequestError(ErrorCode.MEDIA_FILE_TOO_LARGE);
		}

		if (contentType && !rules.mimePattern.test(contentType)) {
			throw new HttpBadRequestError(
				ErrorCode.MEDIA_UPLOAD_INVALID_CONTENT_TYPE,
			);
		}
	}

	private buildStorageKey(
		folder: string,
		userId: string,
		fileName: string,
	): string {
		const extension = fileName.split('.').pop()?.toLowerCase() || 'bin';
		return `${folder}/${userId}/${uuidv4()}.${extension}`;
	}

	private buildCdnUrl(storageKey: string): string {
		const fileDriver = this.getFileDriver();
		if (
			fileDriver === FileDriver.S3 ||
			fileDriver === FileDriver.S3_PRESIGNED
		) {
			return this.s3Service.getPublicUrl(storageKey);
		}
		return `/uploads/${storageKey}`;
	}

	private getLocalFilePath(storageKey: string): string {
		return path.join(process.cwd(), 'uploads', storageKey);
	}

	private getFileDriver(): FileDriver {
		return this.configService.get<FileDriver>('file.driver', FileDriver.LOCAL);
	}

	private inferPurposeFromKey(media: Media): MediaPurpose {
		if (media.storageKey.startsWith('avatars/')) {
			return MediaPurpose.AVATAR;
		}
		if (media.storageKey.startsWith('covers/')) {
			return MediaPurpose.COVER;
		}
		if (media.storageKey.startsWith('production-logs/')) {
			return MediaPurpose.PRODUCTION_LOG_IMAGE;
		}
		if (media.storageKey.startsWith('products/')) {
			return MediaPurpose.PRODUCT_IMAGE;
		}
		if (media.storageKey.startsWith('green-profiles/')) {
			return media.mediaType === 'video'
				? MediaPurpose.GREEN_PROFILE_VIDEO
				: MediaPurpose.GREEN_PROFILE_PHOTO;
		}
		if (media.storageKey.startsWith('posts/')) {
			return MediaPurpose.POST_IMAGE;
		}
		throw new HttpBadRequestError(ErrorCode.MEDIA_INVALID_PURPOSE);
	}
}
