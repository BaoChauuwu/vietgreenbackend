import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { EntityHelper } from '@app/utils/entity-helper';
import { TradeType } from '@app/common/enums/trade-type.enum';
import { TradeStatus } from '@app/common/enums/trade-status.enum';
import { bigintTransformer } from '@app/database/typeorm/transformers/bigint.transformer';
import { numericTransformer } from '@app/database/typeorm/transformers/numeric.transformer';
import { User } from '../identity/user.entity';
import { Organization } from '../identity/organization.entity';
import { Product } from './product.entity';
import { Category } from './category.entity';

@Entity({ name: 'trade_posts', schema: 'agriculture' })
@Index('idx_tp_type', ['tradeType', 'status'])
@Index('idx_tp_province', ['province', 'status'])
@Index('idx_tp_category', ['categoryId', 'status'])
export class TradePost extends EntityHelper {
	@Column({ name: 'poster_user_id', type: 'uuid', nullable: true })
	posterUserId: string | null;

	@Column({ name: 'organization_id', type: 'uuid', nullable: true })
	organizationId: string | null;

	@Column({
		name: 'trade_type',
		type: 'enum',
		enum: TradeType,
		enumName: 'trade_type',
	})
	tradeType: TradeType;

	@Column({ name: 'product_id', type: 'uuid', nullable: true })
	productId: string | null;

	@Column({ name: 'category_id', type: 'uuid', nullable: true })
	categoryId: string | null;

	@Column({ name: 'title', type: 'text' })
	title: string;

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
		name: 'price_reference',
		type: 'bigint',
		nullable: true,
		transformer: bigintTransformer,
	})
	priceReference: number | null;

	@Column({ name: 'province', type: 'text', nullable: true })
	province: string | null;

	@Column({ name: 'province_code', type: 'int', nullable: true })
	provinceCode: number | null;

	@Column({ name: 'district_code', type: 'int', nullable: true })
	districtCode: number | null;

	@Column({ name: 'ward_code', type: 'int', nullable: true })
	wardCode: number | null;

	@Column({ name: 'description', type: 'text', nullable: true })
	description: string | null;

	@Column({ name: 'photo_media_ids', type: 'uuid', array: true, default: '{}' })
	photoMediaIds: string[];

	@Column({
		name: 'cert_requirements',
		type: 'text',
		array: true,
		default: '{}',
	})
	certRequirements: string[];

	@Column({ name: 'deadline', type: 'date', nullable: true })
	deadline: string | null;

	@Column({ name: 'listing_days', type: 'smallint', default: 14 })
	listingDays: number;

	@Column({ name: 'expires_at', type: 'timestamptz' })
	expiresAt: Date;

	@Column({
		name: 'status',
		type: 'enum',
		enum: TradeStatus,
		enumName: 'trade_status',
		default: TradeStatus.ACTIVE,
	})
	status: TradeStatus;

	@Column({ name: 'interested_count', type: 'int', default: 0 })
	interestedCount: number;

	@Column({ name: 'view_count', type: 'int', default: 0 })
	viewCount: number;

	@Column({ name: 'version', type: 'int', default: 0 })
	version: number;

	@ManyToOne(() => User, { onDelete: 'RESTRICT', nullable: true })
	@JoinColumn({ name: 'poster_user_id' })
	posterUser: User | null;

	@ManyToOne(() => Organization, { onDelete: 'RESTRICT', nullable: true })
	@JoinColumn({ name: 'organization_id' })
	organization: Organization | null;

	@ManyToOne(() => Product, { onDelete: 'SET NULL', nullable: true })
	@JoinColumn({ name: 'product_id' })
	product: Product | null;

	@ManyToOne(() => Category, { onDelete: 'SET NULL', nullable: true })
	@JoinColumn({ name: 'category_id' })
	category: Category | null;
}
