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

// UNIQUE (platform, latest_version): only one record per platform+version combination
@Entity({ name: 'app_versions', schema: 'system' })
@Index('idx_app_versions_platform_released', ['platform', 'releasedAt'])
@Unique(['platform', 'latestVersion'])
export class AppVersion {
	@PrimaryGeneratedColumn('uuid', { name: 'id' })
	id: string;

	@Column({ name: 'platform', type: 'text' })
	platform: string; // 'ios' | 'android'

	@Column({ name: 'latest_version', type: 'text' })
	latestVersion: string;

	@Column({ name: 'min_version', type: 'text' })
	minVersion: string;

	@Column({ name: 'recommended_version', type: 'text', nullable: true })
	recommendedVersion: string | null;

	@Column({ name: 'force_update', type: 'boolean', default: false })
	forceUpdate: boolean;

	@Column({ name: 'soft_update', type: 'boolean', default: false })
	softUpdate: boolean;

	@Column({ name: 'store_url_ios', type: 'text', nullable: true })
	storeUrlIos: string | null;

	@Column({ name: 'store_url_android', type: 'text', nullable: true })
	storeUrlAndroid: string | null;

	@Column({ name: 'release_notes_vi', type: 'text', nullable: true })
	releaseNotesVi: string | null;

	@Column({ name: 'release_notes_en', type: 'text', nullable: true })
	releaseNotesEn: string | null;

	@Column({ name: 'released_at', type: 'timestamptz', default: () => 'NOW()' })
	releasedAt: Date;

	@Column({ name: 'created_by', type: 'uuid', nullable: true })
	createdBy: string | null;

	@CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
	createdAt: Date;

	@UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
	updatedAt: Date;

	@ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
	@JoinColumn({ name: 'created_by' })
	creator: User | null;
}
