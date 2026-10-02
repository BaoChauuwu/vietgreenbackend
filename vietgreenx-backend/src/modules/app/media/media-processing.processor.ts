import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import sharp from 'sharp';
import { S3Service } from '@app/services/aws/s3/s3.service';
import { MediaRepository } from '@app/database/typeorm/repositories/media.repository';
import {
	MEDIA_PROCESSING_QUEUE,
	MediaProcessingJobPayload,
} from './media-processing.queue';

const THUMBNAIL_WIDTH = 400;
const THUMBNAIL_MIME = 'image/webp';

@Processor(MEDIA_PROCESSING_QUEUE)
export class MediaProcessingProcessor extends WorkerHost {
	private readonly logger = new Logger(MediaProcessingProcessor.name);

	constructor(
		private readonly s3Service: S3Service,
		private readonly mediaRepository: MediaRepository,
	) {
		super();
	}

	async process(job: Job<MediaProcessingJobPayload>): Promise<void> {
		const { mediaId, storageKey } = job.data;

		try {
			const original = await this.s3Service.downloadToBuffer(storageKey);

			const { data, info } = await sharp(original)
				.resize({ width: THUMBNAIL_WIDTH, withoutEnlargement: true })
				.webp({ quality: 80 })
				.toBuffer({ resolveWithObject: true });

			const thumbnailKey = this.buildThumbnailKey(storageKey);
			await this.s3Service.uploadBuffer(thumbnailKey, data, THUMBNAIL_MIME);
			const thumbnailUrl = this.s3Service.getPublicUrl(thumbnailKey);

			const meta = await sharp(original).metadata();

			await this.mediaRepository.update(mediaId, {
				thumbnailUrl,
				widthPx: meta.width,
				heightPx: meta.height,
			});

			this.logger.log(
				`Processed media ${mediaId}: ${info.width}x${info.height} webp thumbnail`,
			);
		} catch (error) {
			this.logger.error(
				`Failed to process media ${mediaId}: ${(error as Error).message}`,
				(error as Error).stack,
			);
			// Do not rethrow — original cdnUrl remains usable, failure is non-fatal
		}
	}

	private buildThumbnailKey(storageKey: string): string {
		const lastDot = storageKey.lastIndexOf('.');
		const base = lastDot !== -1 ? storageKey.slice(0, lastDot) : storageKey;
		return `${base}_thumb.webp`;
	}
}
