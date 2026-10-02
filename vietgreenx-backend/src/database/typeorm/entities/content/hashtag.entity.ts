import {
	Column,
	Entity,
	Index,
	PrimaryGeneratedColumn,
	CreateDateColumn,
} from 'typeorm';

@Entity({ name: 'hashtags', schema: 'content' })
@Index('idx_hashtag_tag', ['tag'])
export class Hashtag {
	@PrimaryGeneratedColumn('uuid', { name: 'id' })
	id: string;

	@Column({ name: 'tag', type: 'text', unique: true })
	tag: string;

	@Column({ name: 'post_count', type: 'int', default: 0 })
	postCount: number;

	@CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
	createdAt: Date;
}
