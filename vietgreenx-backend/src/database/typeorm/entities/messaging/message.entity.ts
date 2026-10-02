import {
	Column,
	CreateDateColumn,
	DeleteDateColumn,
	Entity,
	Index,
	JoinColumn,
	ManyToOne,
	PrimaryGeneratedColumn,
} from 'typeorm';
import { Conversation } from './conversation.entity';
import { User } from '../identity/user.entity';
import { Media } from '../media/media.entity';

// messaging.messages has: id, created_at, deleted_at — NO updated_at
// Do NOT extend EntityHelper (which adds updated_at)
@Entity({ name: 'messages', schema: 'messaging' })
@Index('idx_msg_conv', ['conversationId'])
export class Message {
	@PrimaryGeneratedColumn('uuid', { name: 'id' })
	id: string;

	@Column({ name: 'conversation_id', type: 'uuid' })
	conversationId: string;

	@Column({ name: 'sender_id', type: 'uuid' })
	senderId: string;

	@Column({ name: 'body', type: 'text', nullable: true })
	body: string | null;

	@Column({ name: 'media_id', type: 'uuid', nullable: true })
	mediaId: string | null;

	@Column({ name: 'message_type', type: 'text', default: 'text' })
	messageType: string; // 'text' | 'image' | 'product_card' | 'system'

	@Column({ name: 'metadata', type: 'jsonb', default: '{}' })
	metadata: Record<string, unknown>;

	@Column({ name: 'read_by', type: 'uuid', array: true, default: '{}' })
	readBy: string[];

	@CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
	createdAt: Date;

	@DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
	deletedAt: Date | null;

	@ManyToOne(() => Conversation, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'conversation_id' })
	conversation: Conversation;

	@ManyToOne(() => User, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'sender_id' })
	sender: User;

	@ManyToOne(() => Media, { onDelete: 'SET NULL', nullable: true })
	@JoinColumn({ name: 'media_id' })
	media: Media | null;
}
