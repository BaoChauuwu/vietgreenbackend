import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { FcmService } from '@app/services/fcm/fcm.service';
import { NOTIFICATION_QUEUE } from './notification.queue';

export interface SendPushPayload {
	userId: string;
	title: string;
	body: string;
}

@Processor(NOTIFICATION_QUEUE)
export class NotificationPushProcessor extends WorkerHost {
	private readonly logger = new Logger(NotificationPushProcessor.name);

	constructor(private readonly fcmService: FcmService) {
		super();
	}

	async process(job: Job<SendPushPayload>): Promise<void> {
		const { userId, title, body } = job.data;
		try {
			await this.fcmService.sendToUser(userId, { title, body });
		} catch (error) {
			this.logger.error(
				`Failed to send push to user ${userId} (job ${job.id})`,
				error instanceof Error ? error.stack : error,
			);
			// Re-throw so BullMQ can retry with its backoff policy.
			throw error;
		}
	}
}
