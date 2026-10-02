import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { MediaController } from './media.controller';
import { MediaUploadService } from './media-upload.service';
import { MediaRepository } from '@app/database/typeorm/repositories/media.repository';
import { Media } from '@app/database/typeorm/entities/media/media.entity';
import { AppAuthModule } from '@app/modules/app/app-auth/app-auth.module';
import { PendingMediaCleanupJob } from '@app/job/pending-media-cleanup.job';
import { MEDIA_PROCESSING_QUEUE } from './media-processing.queue';
import { MediaProcessingProcessor } from './media-processing.processor';

@Module({
	imports: [
		TypeOrmModule.forFeature([Media]),
		AppAuthModule,
		BullModule.registerQueue({
			name: MEDIA_PROCESSING_QUEUE,
			defaultJobOptions: {
				attempts: 3,
				backoff: { type: 'exponential', delay: 2000 },
				removeOnComplete: true,
				removeOnFail: false,
			},
		}),
	],
	controllers: [MediaController],
	providers: [
		MediaUploadService,
		MediaRepository,
		PendingMediaCleanupJob,
		MediaProcessingProcessor,
	],
	exports: [MediaUploadService, MediaRepository],
})
export class AppMediaModule {}
