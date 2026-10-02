import {
	Column,
	Entity,
	Index,
	JoinColumn,
	ManyToOne,
	PrimaryGeneratedColumn,
	CreateDateColumn,
	Unique,
} from 'typeorm';
import { PublicTraceToken } from './public-trace-token.entity';
import { User } from '../identity/user.entity';

// uq_product_review: one review per (token, reviewer) — enforced in DB
@Entity({ name: 'product_reviews', schema: 'agriculture' })
@Index('idx_product_review_token', ['tokenId'])
@Unique('uq_product_review', ['tokenId', 'reviewerId'])
export class ProductReview {
	@PrimaryGeneratedColumn('uuid', { name: 'id' })
	id: string;

	@Column({ name: 'token_id', type: 'uuid' })
	tokenId: string;

	@Column({ name: 'reviewer_id', type: 'uuid' })
	reviewerId: string;

	@Column({ name: 'rating', type: 'smallint' })
	rating: number; // 1–5

	@Column({ name: 'review_body', type: 'text', nullable: true })
	reviewBody: string | null;

	@Column({ name: 'photo_media_ids', type: 'uuid', array: true, default: [] })
	photoMediaIds: string[];

	@Column({ name: 'is_hidden', type: 'boolean', default: false })
	isHidden: boolean;

	@CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
	createdAt: Date;

	@ManyToOne(() => PublicTraceToken, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'token_id' })
	token: PublicTraceToken;

	@ManyToOne(() => User, { onDelete: 'RESTRICT' })
	@JoinColumn({ name: 'reviewer_id' })
	reviewer: User;
}
