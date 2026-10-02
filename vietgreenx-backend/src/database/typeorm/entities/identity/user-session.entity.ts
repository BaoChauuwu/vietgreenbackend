import {
	Column,
	Entity,
	Index,
	JoinColumn,
	ManyToOne,
	PrimaryGeneratedColumn,
	CreateDateColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity({ name: 'user_sessions', schema: 'identity' })
@Index('idx_sessions_user', ['userId'])
export class UserSession {
	@PrimaryGeneratedColumn('uuid', { name: 'id' })
	id: string;

	@Column({ name: 'user_id', type: 'uuid' })
	userId: string;

	@Column({ name: 'token_hash', type: 'text', unique: true })
	tokenHash: string;

	@Column({ name: 'device_id', type: 'text', nullable: true })
	deviceId: string | null;

	@Column({ name: 'device_name', type: 'text', nullable: true })
	deviceName: string | null;

	@Column({ name: 'ip_address', type: 'inet', nullable: true })
	ipAddress: string | null;

	@Column({ name: 'user_agent', type: 'text', nullable: true })
	userAgent: string | null;

	@Column({ name: 'platform', type: 'text', nullable: true })
	platform: string | null; // 'ios' | 'android' | 'web' | 'desktop'

	@Column({ name: 'expires_at', type: 'timestamptz' })
	expiresAt: Date;

	@Column({ name: 'revoked_at', type: 'timestamptz', nullable: true })
	revokedAt: Date | null;

	@Column({ name: 'last_used_at', type: 'timestamptz', nullable: true })
	lastUsedAt: Date | null;

	@CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
	createdAt: Date;

	@ManyToOne(() => User, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'user_id' })
	user: User;
}
