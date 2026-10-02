import {
	Column,
	Entity,
	Index,
	JoinColumn,
	ManyToOne,
	PrimaryGeneratedColumn,
	CreateDateColumn,
	UpdateDateColumn,
	Unique,
} from 'typeorm';
import { Organization } from './organization.entity';
import { User } from './user.entity';

// uq_org_member: a user can only be a member of an organization once
@Entity({ name: 'organization_members', schema: 'identity' })
@Index('idx_org_member_org', ['organizationId'])
@Index('idx_org_member_user', ['userId'])
@Unique('uq_org_member', ['organizationId', 'userId'])
export class OrganizationMember {
	@PrimaryGeneratedColumn('uuid', { name: 'id' })
	id: string;

	@Column({ name: 'organization_id', type: 'uuid' })
	organizationId: string;

	@Column({ name: 'user_id', type: 'uuid' })
	userId: string;

	@Column({ name: 'org_role', type: 'text', default: 'org_member' })
	orgRole: string; // 'org_admin' | 'org_member' | 'org_viewer'

	@Column({ name: 'invited_by', type: 'uuid', nullable: true })
	invitedBy: string | null;

	@Column({ name: 'joined_at', type: 'timestamptz', default: () => 'NOW()' })
	joinedAt: Date;

	@Column({ name: 'status', type: 'text', default: 'active' })
	status: string; // 'active' | 'inactive' | 'invited' | 'removed'

	@CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
	createdAt: Date;

	@UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
	updatedAt: Date;

	@ManyToOne(() => Organization, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'organization_id' })
	organization: Organization;

	@ManyToOne(() => User, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'user_id' })
	user: User;

	@ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
	@JoinColumn({ name: 'invited_by' })
	inviter: User | null;
}
