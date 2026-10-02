import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '@app/database/typeorm/entities';

@Injectable()
export class AuditLogService {
	private readonly logger = new Logger(AuditLogService.name);

	constructor(
		@InjectRepository(AuditLog)
		private readonly auditLogRepository: Repository<AuditLog>,
	) {}

	/**
	 * Log an action asynchronously without blocking the request flow.
	 */
	log(data: Partial<AuditLog>): void {
		const auditLog = this.auditLogRepository.create(data);
		this.auditLogRepository.save(auditLog).catch((error) => {
			this.logger.error(
				'Failed to save audit log',
				error instanceof Error ? error.stack : error,
			);
		});
	}
}
