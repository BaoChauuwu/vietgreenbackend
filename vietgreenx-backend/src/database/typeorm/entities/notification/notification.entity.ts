import {
	Column,
	Entity,
	Index,
	JoinColumn,
	ManyToOne,
	PrimaryGeneratedColumn,
	CreateDateColumn,
} from 'typeorm';
import { NotifType } from '@app/common/enums/notif-type.enum';
import { User } from '../identity/user.entity';

@Entity({ name: 'notifications', schema: 'notification' })
@Index('idx_notif_inbox', ['recipientId', 'createdAt'])
@Index('idx_notif_all', ['recipientId', 'createdAt'])
export class Notification {
	@PrimaryGeneratedColumn('uuid', { name: 'id' })
	id: string;

	@Column({ name: 'recipient_id', type: 'uuid' })
	recipientId: string;

	@Column({ name: 'actor_id', type: 'uuid', nullable: true })
	actorId: string | null;

	@Column({
		name: 'notif_type',
		type: 'enum',
		enum: NotifType,
		enumName: 'notif_type',
	})
	notifType: NotifType;

	@Column({ name: 'entity_type', type: 'text', nullable: true })
	entityType: string | null;

	@Column({ name: 'entity_id', type: 'uuid', nullable: true })
	entityId: string | null;

	@Column({ name: 'title', type: 'text' })
	title: string;

	@Column({ name: 'body', type: 'text', nullable: true })
	body: string | null;

	@Column({ name: 'deep_link', type: 'text', nullable: true })
	deepLink: string | null;

	@Column({ name: 'is_read', type: 'boolean', default: false })
	isRead: boolean;

	@Column({ name: 'read_at', type: 'timestamptz', nullable: true })
	readAt: Date | null;

	@CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
	createdAt: Date;

	@ManyToOne(() => User, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'recipient_id' })
	recipient: User;

	@ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
	@JoinColumn({ name: 'actor_id' })
	actor: User | null;
}
