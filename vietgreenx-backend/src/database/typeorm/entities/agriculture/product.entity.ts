import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { EntityHelper } from '@app/utils/entity-helper';
import { ProductStatus } from '@app/common/enums/product-status.enum';
import { bigintTransformer } from '@app/database/typeorm/transformers/bigint.transformer';
import { numericTransformer } from '@app/database/typeorm/transformers/numeric.transformer';
import { User } from '../identity/user.entity';
import { Organization } from '../identity/organization.entity';
import { GreenProfile } from './green-profile.entity';
import { Category } from './category.entity';

@Entity({ name: 'products', schema: 'agriculture' })
@Index('idx_product_owner', ['ownerUserId'])
@Index('idx_product_org', ['organizationId'])
@Index('idx_product_category', ['categoryId', 'status'])
export class Product extends EntityHelper {
	@Column({ name: 'owner_user_id', type: 'uuid', nullable: true })
	ownerUserId: string | null;

	@Column({ name: 'organization_id', type: 'uuid', nullable: true })
	organizationId: string | null;

	@Column({ name: 'green_profile_id', type: 'uuid', nullable: true })
	greenProfileId: string | null;

	@Column({ name: 'category_id', type: 'uuid' })
	categoryId: string;

	@Column({ name: 'name', type: 'text' })
	name: string;

	@Column({ name: 'slug', type: 'text', nullable: true, unique: true })
	slug: string | null;

	@Column({ name: 'description', type: 'text', nullable: true })
	description: string | null;

	@Column({ name: 'production_location', type: 'text', nullable: true })
	productionLocation: string | null;

	@Column({ name: 'province', type: 'text', nullable: true })
	province: string | null;

	@Column({ name: 'district', type: 'text', nullable: true })
	district: string | null;

	@Column({ name: 'province_code', type: 'int', nullable: true })
	provinceCode: number | null;

	@Column({ name: 'district_code', type: 'int', nullable: true })
	districtCode: number | null;

	@Column({ name: 'ward_code', type: 'int', nullable: true })
	wardCode: number | null;

	@Column({ name: 'harvest_date', type: 'date', nullable: true })
	harvestDate: string | null;

	@Column({
		name: 'price_reference',
		type: 'bigint',
		nullable: true,
		transformer: bigintTransformer,
	})
	priceReference: number | null;

	@Column({ name: 'price_unit', type: 'text', nullable: true })
	priceUnit: string | null;

	@Column({
		name: 'available_quantity',
		type: 'decimal',
		precision: 12,
		scale: 2,
		nullable: true,
		transformer: numericTransformer,
	})
	availableQuantity: number | null;

	@Column({
		name: 'quality_standards',
		type: 'text',
		array: true,
		default: '{}',
	})
	qualityStandards: string[];

	@Column({ name: 'photo_media_ids', type: 'uuid', array: true, default: '{}' })
	photoMediaIds: string[];

	@Column({
		name: 'status',
		type: 'enum',
		enum: ProductStatus,
		enumName: 'product_status',
		default: ProductStatus.DRAFT,
	})
	status: ProductStatus;

	@Column({ name: 'is_for_marketplace', type: 'boolean', default: false })
	isForMarketplace: boolean;

	@Column({ name: 'has_qr', type: 'boolean', default: false })
	hasQr: boolean;

	@Column({ name: 'view_count', type: 'int', default: 0 })
	viewCount: number;

	@Column({ name: 'version', type: 'int', default: 0 })
	version: number;

	@ManyToOne(() => User, { onDelete: 'RESTRICT', nullable: true })
	@JoinColumn({ name: 'owner_user_id' })
	ownerUser: User | null;

	@ManyToOne(() => Organization, { onDelete: 'RESTRICT', nullable: true })
	@JoinColumn({ name: 'organization_id' })
	organization: Organization | null;

	@ManyToOne(() => GreenProfile, { onDelete: 'SET NULL', nullable: true })
	@JoinColumn({ name: 'green_profile_id' })
	greenProfile: GreenProfile | null;

	@ManyToOne(() => Category, { onDelete: 'RESTRICT' })
	@JoinColumn({ name: 'category_id' })
	category: Category;
}
