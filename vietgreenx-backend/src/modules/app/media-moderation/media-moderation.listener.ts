import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { MediaCompletedEvent } from '../media/events/media-completed.event';
import { MediaModerationService } from './media-moderation.service';
import { purposeFromStorageKey } from './constants/moderation-scope.constant';

@Injectable()
export class MediaModerationListener {
	private readonly logger = new Logger(MediaModerationListener.name);

	constructor(private readonly service: MediaModerationService) {}

	@OnEvent('media.completed', { async: true })
	async handleMediaCompleted(event: MediaCompletedEvent): Promise<void> {
		try {
			const { media } = event;
			if (media.mediaType !== 'image') return;
			const purpose = purposeFromStorageKey(media.storageKey);
			if (!purpose) return;

			await this.service.enqueue({
				mediaId: media.id,
				ownerId: media.uploaderId,
				storageKey: media.storageKey,
				purpose,
			});
		} catch (error) {
			this.logger.error(
				'Failed to enqueue media moderation',
				error instanceof Error ? error.stack : error,
			);
		}
	}
}
