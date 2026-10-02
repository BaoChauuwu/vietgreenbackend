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
import { ReactionType } from '@app/common/enums/reaction-type.enum';
import { User } from '../identity/user.entity';

// uq_reaction: one reaction per (user, target) — a user cannot react twice to the same entity
@Entity({ name: 'reactions', schema: 'engagement' })
@Index('idx_reactions_target', ['targetType', 'targetId'])
@Index('idx_reactions_user', ['userId'])
@Unique('uq_reaction', ['userId', 'targetType', 'targetId'])
export class Reaction {
	@PrimaryGeneratedColumn('uuid', { name: 'id' })
	id: string;

	@Column({ name: 'user_id', type: 'uuid' })
	userId: string;

	@Column({ name: 'target_type', type: 'text' })
	targetType: string; // 'post' | 'comment'

	@Column({ name: 'target_id', type: 'uuid' })
	targetId: string;

	@Column({
		name: 'reaction',
		type: 'enum',
		enum: ReactionType,
		enumName: 'reaction_type',
	})
	reaction: ReactionType;

	@CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
	createdAt: Date;

	@ManyToOne(() => User, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'user_id' })
	user: User;
}
