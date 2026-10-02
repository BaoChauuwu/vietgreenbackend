import { Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Post } from './post.entity';
import { Hashtag } from './hashtag.entity';

@Entity({ name: 'post_hashtags', schema: 'content' })
@Index('idx_post_hashtags_tag', ['hashtagId'])
export class PostHashtag {
	@PrimaryColumn({ name: 'post_id', type: 'uuid' })
	postId: string;

	@PrimaryColumn({ name: 'hashtag_id', type: 'uuid' })
	hashtagId: string;

	@ManyToOne(() => Post, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'post_id' })
	post: Post;

	@ManyToOne(() => Hashtag, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'hashtag_id' })
	hashtag: Hashtag;
}
