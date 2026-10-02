import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { EntityHelper } from '@app/utils/entity-helper';
import { CertificationType } from '@app/common/enums/certification-type.enum';
import { CertificationStatus } from '@app/common/enums/certification-status.enum';
import { GreenProfile } from './green-profile.entity';

@Entity({ name: 'certifications', schema: 'agriculture' })
@Index('idx_cert_gp', ['greenProfileId'])
export class Certification extends EntityHelper {
	@Column({ name: 'green_profile_id', type: 'uuid' })
	greenProfileId: string;

	@Column({
		name: 'cert_type',
		type: 'enum',
		enum: CertificationType,
		enumName: 'certification_type',
	})
	certType: CertificationType;

	@Column({ name: 'cert_number', type: 'text', nullable: true })
	certNumber: string | null;

	@Column({ name: 'issuing_authority', type: 'text' })
	issuingAuthority: string;

	@Column({ name: 'issue_date', type: 'date' })
	issueDate: string;

	@Column({ name: 'expiry_date', type: 'date' })
	expiryDate: string;

	@Column({ name: 'document_url', type: 'text' })
	documentUrl: string;

	@Column({
		name: 'status',
		type: 'enum',
		enum: CertificationStatus,
		enumName: 'certification_status',
		default: CertificationStatus.VALID,
	})
	status: CertificationStatus;

	@Column({ name: 'admin_note', type: 'text', nullable: true })
	adminNote: string | null;

	@Column({ name: 'reviewed_by', type: 'uuid', nullable: true })
	reviewedBy: string | null;

	@Column({ name: 'reviewed_at', type: 'timestamptz', nullable: true })
	reviewedAt: Date | null;

	@Column({ name: 'alert_sent_30d', type: 'boolean', default: false })
	alertSent30d: boolean;

	@Column({ name: 'alert_sent_7d', type: 'boolean', default: false })
	alertSent7d: boolean;

	@ManyToOne(() => GreenProfile, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'green_profile_id' })
	greenProfile: GreenProfile;
}
