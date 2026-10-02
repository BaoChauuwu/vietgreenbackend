import { Column, Entity, Index, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { EntityHelper } from '@app/utils/entity-helper';
import { numericTransformer } from '@app/database/typeorm/transformers/numeric.transformer';
import { BatchStatus } from '@app/common/enums/batch-status.enum';
import { Product } from './product.entity';
import { CropSeason } from './crop-season.entity';
import { GreenProfile } from './green-profile.entity';
import { User } from '../identity/user.entity';

// uq_batch_code: batch_code must be unique within a product (not globally)
@Entity({ name: 'batches', schema: 'agriculture' })
@Index('idx_batch_product', ['productId'])
@Index('idx_batch_season', ['cropSeasonId'])
@Index('idx_batch_gp', ['greenProfileId'])
@Index('idx_batch_status', ['status'])
@Unique('uq_batch_code', ['productId', 'batchCode'])
export class Batch extends EntityHelper {
	@Column({ name: 'product_id', type: 'uuid' })
	productId: string;

	@Column({ name: 'crop_season_id', type: 'uuid', nullable: true })
	cropSeasonId: string | null;

	@Column({ name: 'green_profile_id', type: 'uuid', nullable: true })
	greenProfileId: string | null;

	@Column({ name: 'batch_code', type: 'text' })
	batchCode: string;

	@Column({ name: 'harvest_date', type: 'date', nullable: true })
	harvestDate: string | null;

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

	@Column({ name: 'quality_standard', type: 'text', nullable: true })
	qualityStandard: string | null;

	@Column({ name: 'quality_notes', type: 'text', nullable: true })
	qualityNotes: string | null;

	@Column({
		name: 'status',
		type: 'enum',
		enum: BatchStatus,
		enumName: 'batch_status',
		default: BatchStatus.CREATED,
	})
	status: BatchStatus;

	@Column({ name: 'created_by', type: 'uuid' })
	createdBy: string;

	@Column({ name: 'version', type: 'int', default: 0 })
	version: number;

	@ManyToOne(() => Product, { onDelete: 'RESTRICT' })
	@JoinColumn({ name: 'product_id' })
	product: Product;

	@ManyToOne(() => CropSeason, { onDelete: 'SET NULL', nullable: true })
	@JoinColumn({ name: 'crop_season_id' })
	cropSeason: CropSeason | null;

	@ManyToOne(() => GreenProfile, { onDelete: 'SET NULL', nullable: true })
	@JoinColumn({ name: 'green_profile_id' })
	greenProfile: GreenProfile | null;

	@ManyToOne(() => User, { onDelete: 'RESTRICT' })
	@JoinColumn({ name: 'created_by' })
	creator: User;
}
