import {
	Column,
	Entity,
	Index,
	JoinColumn,
	ManyToOne,
	OneToMany,
} from 'typeorm';
import { EntityHelper } from '@app/utils/entity-helper';
import { numericTransformer } from '@app/database/typeorm/transformers/numeric.transformer';
import { VisibilityType } from '@app/common/enums/visibility-type.enum';
import { PostCategory } from '@app/common/enums/post-category.enum';
import { PostSource } from '@app/common/enums/post-source.enum';
import { User } from '../identity/user.entity';
import { Organization } from '../identity/organization.entity';
import { PostMedia } from './post-media.entity';
import { PostHashtag } from './post-hashtag.entity';
import { PostTag } from './post-tag.entity';

@Entity({ name: 'posts', schema: 'content' })
@Index('idx_posts_author', ['authorId'])
@Index('idx_posts_visibility', ['visibility'])
@Index('idx_posts_category', ['category'])
export class Post extends EntityHelper {
	@Column({ name: 'author_id', type: 'uuid' })
	authorId: string;

	@Column({ name: 'org_id', type: 'uuid', nullable: true })
	orgId: string | null;

	@Column({ name: 'body', type: 'text', nullable: true })
	body: string | null;

	@Column({
		name: 'visibility',
		type: 'enum',
		enum: VisibilityType,
		enumName: 'visibility_type',
		default: VisibilityType.PUBLIC,
	})
	visibility: VisibilityType;

	@Column({
		name: 'category',
		type: 'enum',
		enum: PostCategory,
		enumName: 'post_category',
		nullable: true,
	})
	category: PostCategory | null;

	@Column({ name: 'is_draft', type: 'boolean', default: false })
	isDraft: boolean;

	@Column({ name: 'is_edited', type: 'boolean', default: false })
	isEdited: boolean;

	@Column({ name: 'source', type: 'text', nullable: true })
	source: PostSource | null;

	@Column({ name: 'source_metadata', type: 'jsonb', default: '{}' })
	sourceMetadata: Record<string, unknown>;

	@Column({ name: 'external_url', type: 'text', nullable: true })
	externalUrl: string | null;

	@Column({ name: 'external_click_count', type: 'int', default: 0 })
	externalClickCount: number;

	@Column({ name: 'reaction_count', type: 'int', default: 0 })
	reactionCount: number;

	@Column({ name: 'comment_count', type: 'int', default: 0 })
	commentCount: number;

	@Column({ name: 'share_count', type: 'int', default: 0 })
	shareCount: number;

	@Column({ name: 'view_count', type: 'int', default: 0 })
	viewCount: number;

	@Column({
		name: 'ranking_score',
		type: 'decimal',
		precision: 12,
		scale: 4,
		default: 0,
		transformer: numericTransformer,
	})
	rankingScore: number;

	@Column({ name: 'version', type: 'int', default: 0 })
	version: number;

	@ManyToOne(() => User, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'author_id' })
	author: User;

	@ManyToOne(() => Organization, { onDelete: 'SET NULL', nullable: true })
	@JoinColumn({ name: 'org_id' })
	org: Organization | null;

	@OneToMany(() => PostMedia, (pm) => pm.post)
	postMedia: PostMedia[];

	@OneToMany(() => PostHashtag, (ph) => ph.post)
	postHashtags: PostHashtag[];

	@OneToMany(() => PostTag, (pt) => pt.post)
	postTags: PostTag[];
}
