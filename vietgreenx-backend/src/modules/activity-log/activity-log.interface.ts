export interface ActivityLogPayload {
	userId?: string | null;
	sessionId?: string | null;
	action: string;
	entityType?: string | null;
	entityId?: string | null;
	ipAddress?: string | null;
	metadata?: Record<string, any>;
}
