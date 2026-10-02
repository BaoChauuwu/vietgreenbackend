import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import {
	MEDIA_MODERATION_QUEUE,
	MODERATE_MEDIA_JOB,
} from './media-moderation.queue';
import { ModerateMediaJob } from './dto/media-moderation-job.dto';

@Injectable()
export class MediaModerationService {
	constructor(
		@InjectQueue(MEDIA_MODERATION_QUEUE) private readonly queue: Queue,
	) {}

	async enqueue(job: ModerateMediaJob): Promise<void> {
		await this.queue.add(MODERATE_MEDIA_JOB, job, { jobId: job.mediaId });
	}
}
