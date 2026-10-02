import {
	Column,
	Entity,
	JoinColumn,
	ManyToOne,
	PrimaryGeneratedColumn,
	CreateDateColumn,
	UpdateDateColumn,
} from 'typeorm';
import { User } from '../identity/user.entity';

@Entity({ name: 'maintenance_windows', schema: 'system' })
export class MaintenanceWindow {
	@PrimaryGeneratedColumn('uuid', { name: 'id' })
	id: string;

	@Column({ name: 'scope', type: 'text', default: 'all' })
	scope: string; // 'all' | 'ios' | 'android' | 'web' | 'api'

	@Column({ name: 'starts_at', type: 'timestamptz' })
	startsAt: Date;

	@Column({ name: 'ends_at', type: 'timestamptz', nullable: true })
	endsAt: Date | null;

	@Column({ name: 'is_active', type: 'boolean', default: false })
	isActive: boolean;

	@Column({ name: 'title_vi', type: 'text', default: 'Hệ thống đang bảo trì' })
	titleVi: string;

	@Column({ name: 'title_en', type: 'text', default: 'System Maintenance' })
	titleEn: string;

	@Column({ name: 'body_vi', type: 'text' })
	bodyVi: string;

	@Column({ name: 'body_en', type: 'text' })
	bodyEn: string;

	@Column({ name: 'estimated_end_at', type: 'timestamptz', nullable: true })
	estimatedEndAt: Date | null;

	@Column({
		name: 'bypass_roles',
		type: 'text',
		array: true,
		default: () => "'{admin}'",
	})
	bypassRoles: string[];

	@Column({ name: 'created_by', type: 'uuid', nullable: true })
	createdBy: string | null;

	@Column({ name: 'updated_by', type: 'uuid', nullable: true })
	updatedBy: string | null;

	@CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
	createdAt: Date;

	@UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
	updatedAt: Date;

	@ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
	@JoinColumn({ name: 'created_by' })
	creator: User | null;

	@ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
	@JoinColumn({ name: 'updated_by' })
	updater: User | null;
}
