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
import { User } from './user.entity';

@Entity({ name: 'fcm_devices', schema: 'identity' })
@Index('idx_fcm_user', ['userId'])
export class FcmDevice {
	@PrimaryGeneratedColumn('uuid', { name: 'id' })
	id: string;

	@Column({ name: 'user_id', type: 'uuid' })
	userId: string;

	@Column({ name: 'fcm_token', type: 'text', unique: true })
	fcmToken: string;

	@Column({ name: 'platform', type: 'text' })
	platform: string; // 'android' | 'ios' | 'web'

	@Column({ name: 'device_id', type: 'text', nullable: true })
	deviceId: string | null;

	@Column({ name: 'app_version', type: 'text', nullable: true })
	appVersion: string | null;

	@Column({ name: 'is_active', type: 'boolean', default: true })
	isActive: boolean;

	@CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
	createdAt: Date;

	@UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
	updatedAt: Date;

	@ManyToOne(() => User, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'user_id' })
	user: User;
}
