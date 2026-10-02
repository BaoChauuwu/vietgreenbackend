import {
	Column,
	Entity,
	CreateDateColumn,
	PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'rbac_roles', schema: 'identity' })
export class RbacRole {
	@PrimaryGeneratedColumn('uuid', { name: 'id' })
	id: string;

	@Column({ name: 'name', type: 'text', unique: true })
	name: string;

	@Column({ name: 'description', type: 'text', nullable: true })
	description: string | null;

	@Column({ name: 'is_system', type: 'boolean', default: false })
	isSystem: boolean;

	@CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
	createdAt: Date;
}
