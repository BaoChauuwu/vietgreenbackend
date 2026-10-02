import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { EntityHelper } from '@app/utils/entity-helper';
import { SeasonStatus } from '@app/common/enums/season-status.enum';
import { numericTransformer } from '@app/database/typeorm/transformers/numeric.transformer';
import { GreenProfile } from './green-profile.entity';
import { Product } from './product.entity';
import { Organization } from '../identity/organization.entity';
import { User } from '../identity/user.entity';

@Entity({ name: 'crop_seasons', schema: 'agriculture' })
@Index('idx_cs_gp', ['greenProfileId'])
@Index('idx_cs_status', ['status'])
export class CropSeason extends EntityHelper {
	@Column({ name: 'green_profile_id', type: 'uuid' })
	greenProfileId: string;

	@Column({ name: 'product_id', type: 'uuid', nullable: true })
	productId: string | null;

	@Column({ name: 'organization_id', type: 'uuid', nullable: true })
	organizationId: string | null;

	@Column({ name: 'created_by', type: 'uuid' })
	createdBy: string;

	@Column({ name: 'season_name', type: 'text' })
	seasonName: string;

	@Column({ name: 'crop_type', type: 'text' })
	cropType: string;

	@Column({
		name: 'area_ha',
		type: 'decimal',
		precision: 10,
		scale: 2,
		transformer: numericTransformer,
	})
	areaHa: number;

	@Column({ name: 'start_date', type: 'date' })
	startDate: string;

	@Column({ name: 'expected_harvest_date', type: 'date' })
	expectedHarvestDate: string;

	@Column({ name: 'actual_harvest_date', type: 'date', nullable: true })
	actualHarvestDate: string | null;

	@Column({
		name: 'status',
		type: 'enum',
		enum: SeasonStatus,
		enumName: 'season_status',
		default: SeasonStatus.PLANNING,
	})
	status: SeasonStatus;

	@Column({ name: 'notes', type: 'text', nullable: true })
	notes: string | null;

	@Column({ name: 'version', type: 'int', default: 0 })
	version: number;

	@ManyToOne(() => GreenProfile, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'green_profile_id' })
	greenProfile: GreenProfile;

	@ManyToOne(() => Product, { onDelete: 'SET NULL', nullable: true })
	@JoinColumn({ name: 'product_id' })
	product: Product | null;

	@ManyToOne(() => Organization, { onDelete: 'SET NULL', nullable: true })
	@JoinColumn({ name: 'organization_id' })
	organization: Organization | null;

	@ManyToOne(() => User, { onDelete: 'RESTRICT' })
	@JoinColumn({ name: 'created_by' })
	creator: User;
}
