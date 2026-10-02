import {
	Column,
	Entity,
	PrimaryGeneratedColumn,
	CreateDateColumn,
	UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'feature_flags', schema: 'system' })
export class FeatureFlag {
	@PrimaryGeneratedColumn('uuid', { name: 'id' })
	id: string;

	@Column({ name: 'flag_key', type: 'text', unique: true })
	flagKey: string;

	@Column({ name: 'description', type: 'text', nullable: true })
	description: string | null;

	@Column({ name: 'is_enabled', type: 'boolean', default: false })
	isEnabled: boolean;

	@Column({ name: 'rollout_percentage', type: 'smallint', default: 0 })
	rolloutPercentage: number;

	@Column({
		name: 'allowed_user_ids',
		type: 'uuid',
		array: true,
		default: '{}',
	})
	allowedUserIds: string[];

	@Column({ name: 'allowed_roles', type: 'text', array: true, default: '{}' })
	allowedRoles: string[];

	@Column({ name: 'metadata', type: 'jsonb', default: '{}' })
	metadata: Record<string, unknown>;

	@CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
	createdAt: Date;

	@UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
	updatedAt: Date;
}
