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
import { Product } from './product.entity';
import { Batch } from './batch.entity';
import { User } from '../identity/user.entity';

@Entity({ name: 'public_trace_tokens', schema: 'agriculture' })
@Index('idx_trace_product_lookup', ['productId'])
@Index('idx_trace_batch_lookup', ['batchId'])
export class PublicTraceToken {
	@PrimaryGeneratedColumn('uuid', { name: 'id' })
	id: string;

	@Column({
		name: 'token',
		type: 'uuid',
		unique: true,
		default: () => 'uuid_generate_v7()',
	})
	token: string;

	@Column({ name: 'target_type', type: 'text' })
	targetType: string; // 'product' | 'batch'

	@Column({ name: 'product_id', type: 'uuid', nullable: true })
	productId: string | null;

	@Column({ name: 'batch_id', type: 'uuid', nullable: true })
	batchId: string | null;

	@Column({ name: 'qr_image_url', type: 'text', nullable: true })
	qrImageUrl: string | null;

	@Column({ name: 'scan_count', type: 'int', default: 0 })
	scanCount: number;

	@Column({ name: 'is_active', type: 'boolean', default: true })
	isActive: boolean;

	@Column({ name: 'created_by', type: 'uuid' })
	createdBy: string;

	@CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
	createdAt: Date;

	@UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
	updatedAt: Date;

	@ManyToOne(() => Product, { onDelete: 'RESTRICT', nullable: true })
	@JoinColumn({ name: 'product_id' })
	product: Product | null;

	@ManyToOne(() => Batch, { onDelete: 'RESTRICT', nullable: true })
	@JoinColumn({ name: 'batch_id' })
	batch: Batch | null;

	@ManyToOne(() => User, { onDelete: 'RESTRICT' })
	@JoinColumn({ name: 'created_by' })
	creator: User;
}
