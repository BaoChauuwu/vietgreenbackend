import {
	Column,
	Entity,
	Index,
	JoinColumn,
	ManyToOne,
	PrimaryGeneratedColumn,
	CreateDateColumn,
} from 'typeorm';
import { User } from '../identity/user.entity';
import { Post } from '../content/post.entity';

@Entity({ name: 'shares', schema: 'engagement' })
@Index('idx_shares_post', ['postId'])
export class Share {
	@PrimaryGeneratedColumn('uuid', { name: 'id' })
	id: string;

	@Column({ name: 'user_id', type: 'uuid' })
	userId: string;

	@Column({ name: 'post_id', type: 'uuid' })
	postId: string;

	@Column({ name: 'caption', type: 'text', nullable: true })
	caption: string | null;

	@Column({ name: 'share_type', type: 'text', default: 'repost' })
	shareType: string; // 'repost' | 'external_link'

	@CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
	createdAt: Date;

	@ManyToOne(() => User, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'user_id' })
	user: User;

	@ManyToOne(() => Post, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'post_id' })
	post: Post;
}
