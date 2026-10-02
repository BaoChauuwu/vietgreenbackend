import {
	Column,
	Entity,
	CreateDateColumn,
	PrimaryGeneratedColumn,
	Unique,
} from 'typeorm';

// uq_perm: a (resource, action) pair must be unique — no duplicate permission entries
@Entity({ name: 'rbac_permissions', schema: 'identity' })
@Unique('uq_perm', ['resource', 'action'])
export class RbacPermission {
	@PrimaryGeneratedColumn('uuid', { name: 'id' })
	id: string;

	@Column({ name: 'resource', type: 'text' })
	resource: string;

	@Column({ name: 'action', type: 'text' })
	action: string;

	@Column({ name: 'description', type: 'text', nullable: true })
	description: string | null;

	@CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
	createdAt: Date;
}
