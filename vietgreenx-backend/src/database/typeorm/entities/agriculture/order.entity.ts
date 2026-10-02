// src/database/typeorm/entities/agriculture/order.entity.ts
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
import { OrderStatus } from '@app/common/enums/order-status.enum';
import { bigintTransformer } from '@app/database/typeorm/transformers/bigint.transformer';
import { numericTransformer } from '@app/database/typeorm/transformers/numeric.transformer';
import { Quotation } from './quotation.entity';
import { User } from '../identity/user.entity';
import { Organization } from '../identity/organization.entity';
import { Product } from './product.entity';

@Entity({ name: 'orders', schema: 'agriculture' })
@Index('idx_order_buyer', ['buyerId'])
@Index('idx_order_seller', ['sellerId'])
@Index('idx_order_status', ['status'])
export class Order {
	@PrimaryGeneratedColumn('uuid', { name: 'id' })
	id: string;

	@Column({ name: 'quotation_id', type: 'uuid', nullable: true })
	quotationId: string | null;

	@Column({ name: 'buyer_id', type: 'uuid' })
	buyerId: string;

	@Column({ name: 'seller_id', type: 'uuid' })
	sellerId: string;

	@Column({ name: 'organization_id', type: 'uuid', nullable: true })
	organizationId: string | null;

	@Column({ name: 'product_id', type: 'uuid', nullable: true })
	productId: string | null;

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

	@Column({
		name: 'agreed_price',
		type: 'bigint',
		transformer: bigintTransformer,
	})
	agreedPrice: number;

	@Column({
		name: 'total_amount',
		type: 'bigint',
		transformer: bigintTransformer,
	})
	totalAmount: number;

	@Column({
		name: 'platform_fee',
		type: 'bigint',
		default: 0,
		transformer: bigintTransformer,
	})
	platformFee: number;

	@Column({
		name: 'status',
		type: 'enum',
		enum: OrderStatus,
		enumName: 'order_status',
		default: OrderStatus.CONFIRMED,
	})
	status: OrderStatus;

	@Column({ name: 'delivery_terms', type: 'text', nullable: true })
	deliveryTerms: string | null;

	@Column({ name: 'delivery_address', type: 'text', nullable: true })
	deliveryAddress: string | null;

	@Column({ name: 'notes', type: 'text', nullable: true })
	notes: string | null;

	@Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
	completedAt: Date | null;

	@Column({ name: 'cancelled_at', type: 'timestamptz', nullable: true })
	cancelledAt: Date | null;

	@Column({ name: 'cancel_reason', type: 'text', nullable: true })
	cancelReason: string | null;

	@Column({ name: 'version', type: 'int', default: 0 })
	version: number;

	@CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
	createdAt: Date;

	@UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
	updatedAt: Date;

	@ManyToOne(() => Quotation, { onDelete: 'SET NULL', nullable: true })
	@JoinColumn({ name: 'quotation_id' })
	quotation: Quotation | null;

	@ManyToOne(() => User, { onDelete: 'RESTRICT' })
	@JoinColumn({ name: 'buyer_id' })
	buyer: User;

	@ManyToOne(() => User, { onDelete: 'RESTRICT' })
	@JoinColumn({ name: 'seller_id' })
	seller: User;

	@ManyToOne(() => Organization, { onDelete: 'SET NULL', nullable: true })
	@JoinColumn({ name: 'organization_id' })
	organization: Organization | null;

	@ManyToOne(() => Product, { onDelete: 'SET NULL', nullable: true })
	@JoinColumn({ name: 'product_id' })
	product: Product | null;
}
