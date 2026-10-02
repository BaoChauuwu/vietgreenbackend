import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { LessThan } from 'typeorm';
import * as fs from 'fs';
import { MediaRepository } from '@app/database/typeorm/repositories/media.repository';
import { S3Service } from '@app/services/aws/s3/s3.service';
import { FileDriver } from '@app/config/file.config';
import { MEDIA_UPLOAD_EXPIRES_SEC } from '@app/modules/app/media/media-upload.service';

@Injectable()
export class PendingMediaCleanupJob {
	private readonly logger = new Logger(PendingMediaCleanupJob.name);

	constructor(
		private readonly mediaRepository: MediaRepository,
		private readonly s3Service: S3Service,
		private readonly configService: ConfigService,
	) {}

	@Cron(CronExpression.EVERY_HOUR)
	async cleanupStalePendingMedia(): Promise<void> {
		const threshold = new Date(Date.now() - MEDIA_UPLOAD_EXPIRES_SEC * 1000);

		const staleMedia = await this.mediaRepository.findAll({
			where: {
				processingStatus: 'pending',
				createdAt: LessThan(threshold),
			},
			select: {
				id: true,
				storageKey: true,
			},
		});

		if (staleMedia.length === 0) {
			return;
		}

		const fileDriver = this.configService.get<FileDriver>(
			'file.driver',
			FileDriver.LOCAL,
		);

		for (const media of staleMedia) {
			try {
				if (
					fileDriver === FileDriver.S3 ||
					fileDriver === FileDriver.S3_PRESIGNED
				) {
					const head = await this.s3Service.headObject(media.storageKey);
					if (head.exists) {
						await this.s3Service.deleteFile(media.storageKey);
					}
				} else {
					const localPath = this.getLocalFilePath(media.storageKey);
					if (fs.existsSync(localPath)) {
						await fs.promises.unlink(localPath);
					}
				}

				await this.mediaRepository.delete(media.id);
			} catch (error) {
				this.logger.warn(
					`Failed to cleanup pending media ${media.id}: ${error instanceof Error ? error.message : error}`,
				);
			}
		}

		this.logger.log(
			`Cleaned up ${staleMedia.length} stale pending media record(s)`,
		);
	}

	private getLocalFilePath(storageKey: string): string {
		return `${process.cwd()}/uploads/${storageKey}`;
	}
}
