import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { RbacRole } from './rbac-role.entity';
import { RbacPermission } from './rbac-permission.entity';

@Entity({ name: 'rbac_role_permissions', schema: 'identity' })
export class RbacRolePermission {
	@PrimaryColumn({ name: 'role_id', type: 'uuid' })
	roleId: string;

	@PrimaryColumn({ name: 'permission_id', type: 'uuid' })
	permissionId: string;

	@Column({ name: 'granted_at', type: 'timestamptz', default: () => 'NOW()' })
	grantedAt: Date;

	@Column({ name: 'granted_by', type: 'uuid', nullable: true })
	grantedBy: string | null;

	@ManyToOne(() => RbacRole, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'role_id' })
	role: RbacRole;

	@ManyToOne(() => RbacPermission, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'permission_id' })
	permission: RbacPermission;
}
