import {
	Column,
	CreateDateColumn,
	Entity,
	Index,
	JoinColumn,
	ManyToOne,
	PrimaryGeneratedColumn,
	Unique,
} from 'typeorm';
import { User } from '../identity/user.entity';

@Entity({ name: 'saved_suppliers', schema: 'agriculture' })
@Unique('uq_saved_supplier', ['userId', 'supplierId'])
@Index('idx_saved_supplier_user', ['userId'])
export class SavedSupplier {
	@PrimaryGeneratedColumn('uuid', { name: 'id' })
	id: string;

	@Column({ name: 'user_id', type: 'uuid' })
	userId: string;

	@Column({ name: 'supplier_id', type: 'uuid' })
	supplierId: string;

	@CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
	createdAt: Date;

	@ManyToOne(() => User, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'user_id' })
	user: User;

	@ManyToOne(() => User, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'supplier_id' })
	supplier: User;
}
