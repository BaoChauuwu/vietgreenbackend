import {
	Column,
	Entity,
	PrimaryGeneratedColumn,
	CreateDateColumn,
	UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'conversations', schema: 'messaging' })
export class Conversation {
	@PrimaryGeneratedColumn('uuid', { name: 'id' })
	id: string;

	@Column({ name: 'conversation_type', type: 'text', default: 'direct' })
	conversationType: string; // 'direct' | 'group'

	@Column({ name: 'name', type: 'text', nullable: true })
	name: string | null;

	@Column({ name: 'last_message_at', type: 'timestamptz', nullable: true })
	lastMessageAt: Date | null;

	@CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
	createdAt: Date;

	@UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
	updatedAt: Date;
}
