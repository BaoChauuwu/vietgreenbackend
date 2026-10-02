import { SetMetadata } from '@nestjs/common';

export interface AuditOptions {
	action: string;
	resourceType?: string;
	resourceIdParam?: string;
}

export const AUDIT_LOG_KEY = 'audit_log';

export const AuditLog = (options: AuditOptions) =>
	SetMetadata(AUDIT_LOG_KEY, options);
