import { Column, Entity, PrimaryColumn } from 'typeorm';
import { UserRole } from '@app/common/enums/user-role.enum';

@Entity({ name: 'audit_logs', schema: 'moderation' })
export class AuditLog {
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

	@Column({
		name: 'actor_role',
		type: 'enum',
		enum: UserRole,
		enumName: 'user_role',
		nullable: true,
	})
	actorRole: UserRole | null;

	@Column({ name: 'action', type: 'text' })
	action: string;

	@Column({ name: 'resource_type', type: 'text', nullable: true })
	resourceType: string | null;

	@Column({ name: 'resource_id', type: 'uuid', nullable: true })
	resourceId: string | null;

	@Column({ name: 'ip_address', type: 'inet', nullable: true })
	ipAddress: string | null;

	@Column({ name: 'user_agent', type: 'text', nullable: true })
	userAgent: string | null;

	@Column({ name: 'metadata', type: 'jsonb', default: '{}' })
	metadata: Record<string, unknown>;
}
