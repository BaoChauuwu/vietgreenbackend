import {
	Column,
	Entity,
	JoinColumn,
	OneToOne,
	PrimaryGeneratedColumn,
	CreateDateColumn,
	UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity({ name: 'user_settings', schema: 'identity' })
export class UserSettings {
	@PrimaryGeneratedColumn('uuid', { name: 'id' })
	id: string;

	@Column({ name: 'user_id', type: 'uuid', unique: true })
	userId: string;

	@Column({ name: 'language', type: 'text', default: 'vi' })
	language: string; // 'vi' | 'en'

	@Column({ name: 'timezone', type: 'text', default: 'Asia/Ho_Chi_Minh' })
	timezone: string;

	@Column({ name: 'theme', type: 'text', default: 'system' })
	theme: string; // 'light' | 'dark' | 'system'

	@Column({ name: 'who_can_follow', type: 'text', default: 'everyone' })
	whoCanFollow: string; // 'everyone' | 'approved'

	@Column({ name: 'who_can_message', type: 'text', default: 'followers' })
	whoCanMessage: string; // 'everyone' | 'followers' | 'nobody'

	@Column({ name: 'show_online_status', type: 'boolean', default: true })
	showOnlineStatus: boolean;

	@Column({ name: 'hide_transactions_tab', type: 'boolean', default: false })
	hideTransactionsTab: boolean;

	@Column({ name: 'notif_new_follower', type: 'boolean', default: true })
	notifNewFollower: boolean;

	@Column({ name: 'notif_post_reaction', type: 'boolean', default: true })
	notifPostReaction: boolean;

	@Column({ name: 'notif_post_comment', type: 'boolean', default: true })
	notifPostComment: boolean;

	@Column({ name: 'notif_mention', type: 'boolean', default: true })
	notifMention: boolean;

	@Column({ name: 'notif_new_message', type: 'boolean', default: true })
	notifNewMessage: boolean;

	@Column({ name: 'notif_new_quotation', type: 'boolean', default: true })
	notifNewQuotation: boolean;

	@Column({ name: 'notif_trade_update', type: 'boolean', default: true })
	notifTradeUpdate: boolean;

	@Column({ name: 'notif_system', type: 'boolean', default: true })
	notifSystem: boolean;

	@Column({ name: 'notif_push_enabled', type: 'boolean', default: true })
	notifPushEnabled: boolean;

	@Column({ name: 'notif_email_enabled', type: 'boolean', default: false })
	notifEmailEnabled: boolean;

	@Column({ name: 'notif_sms_enabled', type: 'boolean', default: false })
	notifSmsEnabled: boolean;

	@CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
	createdAt: Date;

	@UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
	updatedAt: Date;

	@OneToOne(() => User, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'user_id' })
	user: User;
}
