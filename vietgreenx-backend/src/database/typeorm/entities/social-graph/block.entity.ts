import {
	Column,
	Entity,
	Index,
	JoinColumn,
	ManyToOne,
	PrimaryGeneratedColumn,
	CreateDateColumn,
	Unique,
} from 'typeorm';
import { User } from '../identity/user.entity';

// uq_block: a user can only block another user once
@Entity({ name: 'blocks', schema: 'social_graph' })
@Index('idx_blocks_blocker', ['blockerId'])
@Index('idx_blocks_blocked', ['blockedId'])
@Unique('uq_block', ['blockerId', 'blockedId'])
export class Block {
	@PrimaryGeneratedColumn('uuid', { name: 'id' })
	id: string;

	@Column({ name: 'blocker_id', type: 'uuid' })
	blockerId: string;

	@Column({ name: 'blocked_id', type: 'uuid' })
	blockedId: string;

	@CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
	createdAt: Date;

	@ManyToOne(() => User, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'blocker_id' })
	blocker: User;

	@ManyToOne(() => User, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'blocked_id' })
	blocked: User;
}
