import {
	Column,
	Entity,
	Index,
	JoinColumn,
	ManyToOne,
	PrimaryGeneratedColumn,
	CreateDateColumn,
	UpdateDateColumn,
} from 'typeorm';
import { VerificationLevel } from '@app/common/enums/verification-level.enum';
import { User } from './user.entity';
import { Organization } from './organization.entity';

@Entity({ name: 'verification_requests', schema: 'identity' })
@Index('idx_verif_user', ['userId'])
@Index('idx_verif_org', ['organizationId'])
export class VerificationRequest {
	@PrimaryGeneratedColumn('uuid', { name: 'id' })
	id: string;

	@Column({ name: 'user_id', type: 'uuid', nullable: true })
	userId: string | null;

	@Column({ name: 'organization_id', type: 'uuid', nullable: true })
	organizationId: string | null;

	@Column({
		name: 'requested_level',
		type: 'enum',
		enum: VerificationLevel,
		enumName: 'verification_level',
	})
	requestedLevel: VerificationLevel;

	@Column({ name: 'document_type', type: 'text' })
	documentType: string; // 'national_id' | 'business_registration' | 'partnership_agreement' | 'other'

	@Column({ name: 'document_front_url', type: 'text' })
	documentFrontUrl: string;

	@Column({ name: 'document_back_url', type: 'text', nullable: true })
	documentBackUrl: string | null;

	@Column({ name: 'additional_docs', type: 'jsonb', default: '[]' })
	additionalDocs: object[];

	@Column({ name: 'status', type: 'text', default: 'pending' })
	status: string; // 'pending' | 'under_review' | 'approved' | 'rejected'

	@Column({ name: 'rejection_reason', type: 'text', nullable: true })
	rejectionReason: string | null;

	@Column({ name: 'reviewed_by', type: 'uuid', nullable: true })
	reviewedBy: string | null;

	@Column({ name: 'reviewed_at', type: 'timestamptz', nullable: true })
	reviewedAt: Date | null;

	@Column({ name: 'submitted_at', type: 'timestamptz', default: () => 'NOW()' })
	submittedAt: Date;

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

	@ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
	@JoinColumn({ name: 'reviewed_by' })
	reviewer: User | null;
}
