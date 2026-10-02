import {
	Column,
	Entity,
	Index,
	JoinColumn,
	ManyToOne,
	PrimaryGeneratedColumn,
} from 'typeorm';
import { Post } from './post.entity';

@Entity({ name: 'post_tags', schema: 'content' })
@Index('idx_post_tags_post', ['postId'])
export class PostTag {
	@PrimaryGeneratedColumn('uuid', { name: 'id' })
	id: string;

	@Column({ name: 'post_id', type: 'uuid' })
	postId: string;

	@Column({ name: 'tag_type', type: 'text' })
	tagType: string; // 'product' | 'region' | 'category'

	@Column({ name: 'ref_id', type: 'uuid', nullable: true })
	refId: string | null;

	@Column({ name: 'ref_label', type: 'text' })
	refLabel: string;

	@ManyToOne(() => Post, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'post_id' })
	post: Post;
}
