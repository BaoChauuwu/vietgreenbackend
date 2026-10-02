// APPEND-ONLY — partitioned by created_at (monthly)
// PRIMARY KEY (id, created_at) — partition key must be in PK
import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'user_activity_logs', schema: 'analytics' })
export class UserActivityLog {
	@PrimaryColumn({
		name: 'id',
		type: 'uuid',
		default: () => 'uuid_generate_v7()',
	})
	id: string;

	@PrimaryColumn({
		name: 'created_at',
		type: 'timestamptz',
		default: () => 'NOW()',
	})
	createdAt: Date;

	@Column({ name: 'user_id', type: 'uuid', nullable: true })
	userId: string | null;

	@Column({ name: 'session_id', type: 'uuid', nullable: true })
	sessionId: string | null;

	@Column({ name: 'action', type: 'text' })
	action: string;

	@Column({ name: 'entity_type', type: 'text', nullable: true })
	entityType: string | null;

	@Column({ name: 'entity_id', type: 'uuid', nullable: true })
	entityId: string | null;

	@Column({ name: 'ip_address', type: 'inet', nullable: true })
	ipAddress: string | null;

	@Column({ name: 'metadata', type: 'jsonb', default: '{}' })
	metadata: Record<string, unknown>;
}
