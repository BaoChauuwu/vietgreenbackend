import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { EntityHelper } from '@app/utils/entity-helper';
import { Post } from '../content/post.entity';
import { User } from '../identity/user.entity';

@Entity({ name: 'comments', schema: 'engagement' })
@Index('idx_comments_post', ['postId'])
export class Comment extends EntityHelper {
	@Column({ name: 'post_id', type: 'uuid' })
	postId: string;

	@Column({ name: 'author_id', type: 'uuid' })
	authorId: string;

	@Column({ name: 'parent_comment_id', type: 'uuid', nullable: true })
	parentCommentId: string | null;

	@Column({ name: 'body', type: 'text' })
	body: string;

	@Column({ name: 'like_count', type: 'int', default: 0 })
	likeCount: number;

	@Column({ name: 'version', type: 'int', default: 0 })
	version: number;

	@ManyToOne(() => Post, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'post_id' })
	post: Post;

	@ManyToOne(() => User, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'author_id' })
	author: User;

	@ManyToOne(() => Comment, { onDelete: 'CASCADE', nullable: true })
	@JoinColumn({ name: 'parent_comment_id' })
	parentComment: Comment | null;

	@Column({ name: 'reply_to_comment_id', type: 'uuid', nullable: true })
	replyToCommentId: string | null;

	@Column({ name: 'reply_to_user_id', type: 'uuid', nullable: true })
	replyToUserId: string | null;

	@ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
	@JoinColumn({ name: 'reply_to_user_id' })
	replyToUser: User | null;
}
