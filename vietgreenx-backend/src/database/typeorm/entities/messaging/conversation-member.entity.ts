import {
	Column,
	Entity,
	Index,
	JoinColumn,
	ManyToOne,
	PrimaryColumn,
} from 'typeorm';
import { Conversation } from './conversation.entity';
import { User } from '../identity/user.entity';

@Entity({ name: 'conversation_members', schema: 'messaging' })
@Index('idx_cm_user', ['userId'])
export class ConversationMember {
	@PrimaryColumn({ name: 'conversation_id', type: 'uuid' })
	conversationId: string;

	@PrimaryColumn({ name: 'user_id', type: 'uuid' })
	userId: string;

	@Column({ name: 'joined_at', type: 'timestamptz', default: () => 'NOW()' })
	joinedAt: Date;

	@Column({ name: 'last_read_at', type: 'timestamptz', nullable: true })
	lastReadAt: Date | null;

	@Column({ name: 'is_muted', type: 'boolean', default: false })
	isMuted: boolean;

	@ManyToOne(() => Conversation, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'conversation_id' })
	conversation: Conversation;

	@ManyToOne(() => User, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'user_id' })
	user: User;
}
