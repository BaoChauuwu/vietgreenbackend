import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Post } from './post.entity';
import { Media } from '../media/media.entity';

@Entity({ name: 'post_media', schema: 'content' })
export class PostMedia {
	@PrimaryColumn({ name: 'post_id', type: 'uuid' })
	postId: string;

	@PrimaryColumn({ name: 'media_id', type: 'uuid' })
	mediaId: string;

	@Column({ name: 'position', type: 'smallint', default: 0 })
	position: number;

	@ManyToOne(() => Post, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'post_id' })
	post: Post;

	@ManyToOne(() => Media, { onDelete: 'RESTRICT' })
	@JoinColumn({ name: 'media_id' })
	media: Media;
}
