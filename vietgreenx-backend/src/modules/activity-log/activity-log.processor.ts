import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { ActivityLogPayload } from './activity-log.interface';
import { UserActivityLog } from '@app/database/typeorm/entities';

@Processor('activity-log')
export class ActivityLogProcessor extends WorkerHost {
	private readonly logger = new Logger(ActivityLogProcessor.name);

	constructor(@InjectDataSource() private readonly dataSource: DataSource) {
		super();
	}

	/**
	 * Process incoming jobs from the activity-log queue.
	 * Runs a raw SQL query to insert logs into PostgreSQL.
	 */
	async process(job: Job<ActivityLogPayload>): Promise<void> {
		try {
			const {
				userId,
				sessionId,
				action,
				entityType,
				entityId,
				ipAddress,
				metadata,
			} = job.data;

			const repository = this.dataSource.getRepository(UserActivityLog);
			const log = repository.create({
				userId: userId || null,
				sessionId: sessionId || null,
				action,
				entityType: entityType || null,
				entityId: entityId || null,
				ipAddress: ipAddress || null,
				metadata: metadata || {},
			});

			await repository.save(log);
		} catch (error) {
			this.logger.error(
				`Failed to process activity log job ${job.id}`,
				error instanceof Error ? error.stack : error,
			);
		}
	}
}
