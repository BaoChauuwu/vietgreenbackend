import {
	Column,
	CreateDateColumn,
	Entity,
	Index,
	JoinColumn,
	ManyToOne,
	PrimaryGeneratedColumn,
	Unique,
	UpdateDateColumn,
} from 'typeorm';
import { User } from '../identity/user.entity';
import { Order } from './order.entity';

@Entity({ name: 'supplier_reviews', schema: 'agriculture' })
@Unique('uq_supplier_review', ['reviewerId', 'supplierId'])
@Index('idx_supplier_review_supplier', ['supplierId'])
export class SupplierReview {
	@PrimaryGeneratedColumn('uuid', { name: 'id' })
	id: string;

	@Column({ name: 'reviewer_id', type: 'uuid' })
	reviewerId: string;

	@Column({ name: 'supplier_id', type: 'uuid' })
	supplierId: string;

	@Column({ name: 'order_id', type: 'uuid', nullable: true })
	orderId: string | null;

	@Column({ name: 'rating', type: 'smallint' })
	rating: number;

	@Column({ name: 'review_body', type: 'text', nullable: true })
	reviewBody: string | null;

	@Column({ name: 'photo_media_ids', type: 'uuid', array: true, default: [] })
	photoMediaIds: string[];

	@Column({ name: 'is_hidden', type: 'boolean', default: false })
	isHidden: boolean;

	@CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
	createdAt: Date;

	@UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
	updatedAt: Date;

	@ManyToOne(() => User, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'reviewer_id' })
	reviewer: User;

	@ManyToOne(() => User, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'supplier_id' })
	supplier: User;

	@ManyToOne(() => Order, { onDelete: 'SET NULL', nullable: true })
	@JoinColumn({ name: 'order_id' })
	order: Order | null;
}
