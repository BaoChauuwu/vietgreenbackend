// src/database/typeorm/entities/moderation/report.entity.ts
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
import { ReportReason } from '@app/common/enums/report-reason.enum';
import { ReportStatus } from '@app/common/enums/report-status.enum';
import { User } from '../identity/user.entity';

@Entity({ name: 'reports', schema: 'moderation' })
@Index('idx_reports_target', ['targetType', 'targetId'])
export class Report {
	@PrimaryGeneratedColumn('uuid', { name: 'id' })
	id: string;

	@Column({ name: 'reporter_id', type: 'uuid' })
	reporterId: string;

	@Column({ name: 'target_type', type: 'text' })
	targetType: string; // 'post' | 'comment' | 'user' | 'product'

	@Column({ name: 'target_id', type: 'uuid' })
	targetId: string;

	@Column({
		name: 'reason',
		type: 'enum',
		enum: ReportReason,
		enumName: 'report_reason',
	})
	reason: ReportReason;

	@Column({ name: 'details', type: 'text', nullable: true })
	details: string | null;

	@Column({
		name: 'status',
		type: 'enum',
		enum: ReportStatus,
		enumName: 'report_status',
		default: ReportStatus.PENDING,
	})
	status: ReportStatus;

	@Column({ name: 'is_priority', type: 'boolean', default: false })
	isPriority: boolean;

	@Column({ name: 'actioned_by', type: 'uuid', nullable: true })
	actionedBy: string | null;

	@Column({ name: 'action_taken', type: 'text', nullable: true })
	actionTaken: string | null;

	@Column({ name: 'action_note', type: 'text', nullable: true })
	actionNote: string | null;

	@Column({ name: 'actioned_at', type: 'timestamptz', nullable: true })
	actionedAt: Date | null;

	@CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
	createdAt: Date;

	@UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
	updatedAt: Date;

	@ManyToOne(() => User, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'reporter_id' })
	reporter: User;

	@ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
	@JoinColumn({ name: 'actioned_by' })
	actioner: User | null;
}
