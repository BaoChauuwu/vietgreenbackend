import {
	Column,
	Entity,
	Index,
	JoinColumn,
	ManyToOne,
	PrimaryGeneratedColumn,
	CreateDateColumn,
	UpdateDateColumn,
} from 'typeorm';
import { QuotationStatus } from '@app/common/enums/quotation-status.enum';
import { bigintTransformer } from '@app/database/typeorm/transformers/bigint.transformer';
import { numericTransformer } from '@app/database/typeorm/transformers/numeric.transformer';
import { TradePost } from './trade-post.entity';
import { User } from '../identity/user.entity';
import { Product } from './product.entity';

@Entity({ name: 'quotations', schema: 'agriculture' })
@Index('idx_quote_sender', ['senderUserId'])
@Index('idx_quote_receiver', ['receiverUserId'])
export class Quotation {
	@PrimaryGeneratedColumn('uuid', { name: 'id' })
	id: string;

	@Column({ name: 'trade_post_id', type: 'uuid', nullable: true })
	tradePostId: string | null;

	@Column({ name: 'sender_user_id', type: 'uuid' })
	senderUserId: string;

	@Column({ name: 'receiver_user_id', type: 'uuid' })
	receiverUserId: string;

	@Column({ name: 'product_id', type: 'uuid', nullable: true })
	productId: string | null;

	@Column({
		name: 'offered_price',
		type: 'bigint',
		transformer: bigintTransformer,
	})
	offeredPrice: number;

	@Column({ name: 'price_unit', type: 'text' })
	priceUnit: string;

	@Column({
		name: 'quantity',
		type: 'decimal',
		precision: 12,
		scale: 2,
		transformer: numericTransformer,
	})
	quantity: number;

	@Column({ name: 'quantity_unit', type: 'text' })
	quantityUnit: string;

	@Column({ name: 'delivery_terms', type: 'text', nullable: true })
	deliveryTerms: string | null;

	@Column({ name: 'valid_until', type: 'date' })
	validUntil: string;

	@Column({ name: 'notes', type: 'text', nullable: true })
	notes: string | null;

	@Column({
		name: 'status',
		type: 'enum',
		enum: QuotationStatus,
		enumName: 'quotation_status',
		default: QuotationStatus.PENDING,
	})
	status: QuotationStatus;

	@Column({ name: 'rejection_note', type: 'text', nullable: true })
	rejectionNote: string | null;

	@Column({ name: 'accepted_at', type: 'timestamptz', nullable: true })
	acceptedAt: Date | null;

	@Column({ name: 'rejected_at', type: 'timestamptz', nullable: true })
	rejectedAt: Date | null;

	@Column({ name: 'expires_at', type: 'timestamptz' })
	expiresAt: Date;

	@Column({ name: 'version', type: 'int', default: 0 })
	version: number;

	@CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
	createdAt: Date;

	@UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
	updatedAt: Date;

	@ManyToOne(() => TradePost, { onDelete: 'SET NULL', nullable: true })
	@JoinColumn({ name: 'trade_post_id' })
	tradePost: TradePost | null;

	@ManyToOne(() => User, { onDelete: 'RESTRICT' })
	@JoinColumn({ name: 'sender_user_id' })
	sender: User;

	@ManyToOne(() => User, { onDelete: 'RESTRICT' })
	@JoinColumn({ name: 'receiver_user_id' })
	receiver: User;

	@ManyToOne(() => Product, { onDelete: 'SET NULL', nullable: true })
	@JoinColumn({ name: 'product_id' })
	product: Product | null;
}
