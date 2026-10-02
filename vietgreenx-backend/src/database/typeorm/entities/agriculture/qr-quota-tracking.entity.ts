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
import { User } from '../identity/user.entity';
import { Organization } from '../identity/organization.entity';

// uq_quota_user / uq_quota_org: one quota row per (user, period) or (org, period)
@Entity({ name: 'qr_quota_tracking', schema: 'agriculture' })
@Index('idx_quota_user', ['userId', 'billingPeriod'])
@Index('idx_quota_org', ['organizationId', 'billingPeriod'])
@Unique('uq_quota_user', ['userId', 'billingPeriod'])
@Unique('uq_quota_org', ['organizationId', 'billingPeriod'])
export class QrQuotaTracking {
	@PrimaryGeneratedColumn('uuid', { name: 'id' })
	id: string;

	@Column({ name: 'user_id', type: 'uuid', nullable: true })
	userId: string | null;

	@Column({ name: 'organization_id', type: 'uuid', nullable: true })
	organizationId: string | null;

	@Column({ name: 'billing_period', type: 'text' })
	billingPeriod: string;

	@Column({ name: 'qr_generated', type: 'int', default: 0 })
	qrGenerated: number;

	@Column({ name: 'qr_limit', type: 'int', default: 0 })
	qrLimit: number;

	@Column({ name: 'extra_quota', type: 'int', default: 0 })
	extraQuota: number;

	@CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
	createdAt: Date;

	@UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
	updatedAt: Date;

	@ManyToOne(() => User, { onDelete: 'CASCADE', nullable: true })
	@JoinColumn({ name: 'user_id' })
	user: User | null;

	@ManyToOne(() => Organization, { onDelete: 'CASCADE', nullable: true })
	@JoinColumn({ name: 'organization_id' })
	organization: Organization | null;
}
