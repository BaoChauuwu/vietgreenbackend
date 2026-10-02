import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { MEDIA_MODERATION_QUEUE } from './media-moderation.queue';
import { MediaHash } from '@app/database/typeorm/entities/moderation/media-hash.entity';
import { MediaModerationFlag } from '@app/database/typeorm/entities/moderation/media-moderation-flag.entity';
import { MediaHashRepository } from '@app/database/typeorm/repositories/media-hash.repository';
import { MediaModerationFlagRepository } from '@app/database/typeorm/repositories/media-moderation-flag.repository';
import { MediaModerationService } from './media-moderation.service';
import { MediaModerationListener } from './media-moderation.listener';
import { MediaModerationProcessor } from './media-moderation.processor';

@Module({
	imports: [
		TypeOrmModule.forFeature([MediaHash, MediaModerationFlag]),
		BullModule.registerQueue({
			name: MEDIA_MODERATION_QUEUE,
			defaultJobOptions: {
				attempts: 3,
				backoff: { type: 'exponential', delay: 1000 },
				removeOnComplete: true,
				removeOnFail: false,
			},
		}),
	],
	providers: [
		MediaModerationService,
		MediaModerationListener,
		MediaModerationProcessor,
		MediaHashRepository,
		MediaModerationFlagRepository,
	],
	exports: [MediaModerationService],
})
export class MediaModerationModule {}
