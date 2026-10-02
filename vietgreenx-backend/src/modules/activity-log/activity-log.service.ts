import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Request } from 'express';
import { ActivityLogPayload } from './activity-log.interface';

@Injectable()
export class ActivityLogService {
	private readonly logger = new Logger(ActivityLogService.name);

	constructor(
		@InjectQueue('activity-log') private readonly activityQueue: Queue,
	) {}

	log(req: Request, payload: Partial<ActivityLogPayload>): void {
		try {
			const context = req?.['activityLogContext'] || {};
			const userId = payload.userId || req?.['user']?.id || null;

			const jobPayload: ActivityLogPayload = {
				userId,
				sessionId: payload.sessionId || context.sessionId || null,
				action: payload.action || 'UNKNOWN',
				entityType: payload.entityType || null,
				entityId: payload.entityId || null,
				ipAddress: payload.ipAddress || context.ipAddress || null,
				metadata: {
					...(context.metadata || {}),
					...(payload.metadata || {}),
				},
			};

			this.activityQueue.add('log-activity-job', jobPayload).catch((error) => {
				this.logger.error(
					'Failed to add activity log job to BullMQ queue',
					error instanceof Error ? error.stack : error,
				);
			});
		} catch (error) {
			this.logger.error(
				'Error in ActivityLogService.log',
				error instanceof Error ? error.stack : error,
			);
		}
	}
}
