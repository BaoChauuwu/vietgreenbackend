import {
	Column,
	Entity,
	Index,
	JoinColumn,
	OneToOne,
	OneToMany,
} from 'typeorm';
// Note: ManyToOne removed — user_id and organization_id have UNIQUE constraints → OneToOne
import { EntityHelper } from '@app/utils/entity-helper';
import { numericTransformer } from '@app/database/typeorm/transformers/numeric.transformer';
import { User } from '../identity/user.entity';
import { Organization } from '../identity/organization.entity';
import { Certification } from './certification.entity';
import { Product } from './product.entity';
import { Media } from '../media/media.entity';

@Entity({ name: 'green_profiles', schema: 'agriculture' })
@Index('idx_gp_province', ['province'])
@Index('idx_gp_published', ['isPublished'])
export class GreenProfile extends EntityHelper {
	@Column({ name: 'user_id', type: 'uuid', nullable: true, unique: true })
	userId: string | null;

	@Column({
		name: 'organization_id',
		type: 'uuid',
		nullable: true,
		unique: true,
	})
	organizationId: string | null;

	@Column({ name: 'profile_name', type: 'text' })
	profileName: string;

	@Column({ name: 'province', type: 'text' })
	province: string;

	@Column({ name: 'district', type: 'text', nullable: true })
	district: string | null;

	@Column({ name: 'ward', type: 'text', nullable: true })
	ward: string | null;

	@Column({ name: 'address_detail', type: 'text', nullable: true })
	addressDetail: string | null;

	@Column({ name: 'province_code', type: 'int', nullable: true })
	provinceCode: number | null;

	@Column({ name: 'district_code', type: 'int', nullable: true })
	districtCode: number | null;

	@Column({ name: 'ward_code', type: 'int', nullable: true })
	wardCode: number | null;

	/**
	 * ⚠️  NOTE: `location geography(Point, 4326)` is NULLABLE in DB and NOT mapped here.
	 * TypeORM does not support PostGIS geography types natively.
	 * To set location, use raw query or QueryBuilder:
	 *   UPDATE agriculture.green_profiles
	 *   SET location = ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)
	 *   WHERE id = :id
	 * repository.save() is safe — location will remain unchanged (NULL or previous value).
	 */
	// location geography(Point,4326) nullable — NOT mapped, use raw query for geo operations

	@Column({ name: 'growing_zone_code', type: 'text', nullable: true })
	growingZoneCode: string | null;

	@Column({
		name: 'main_category_ids',
		type: 'uuid',
		array: true,
		default: '{}',
	})
	mainCategoryIds: string[];

	@Column({
		name: 'farm_area_ha',
		type: 'decimal',
		precision: 10,
		scale: 2,
		nullable: true,
		transformer: numericTransformer,
	})
	farmAreaHa: number | null;

	@Column({
		name: 'annual_yield_tonnes',
		type: 'decimal',
		precision: 12,
		scale: 2,
		nullable: true,
		transformer: numericTransformer,
	})
	annualYieldTonnes: number | null;

	@Column({ name: 'avatar_media_id', type: 'uuid', nullable: true })
	avatarMediaId: string | null;

	@Column({ name: 'photo_media_ids', type: 'uuid', array: true, default: '{}' })
	photoMediaIds: string[];

	@Column({ name: 'video_media_ids', type: 'uuid', array: true, default: '{}' })
	videoMediaIds: string[];

	@Column({
		name: 'rating',
		type: 'decimal',
		precision: 3,
		scale: 2,
		nullable: true,
		transformer: numericTransformer,
	})
	rating: number | null;

	@Column({ name: 'review_count', type: 'int', default: 0 })
	reviewCount: number;

	@Column({ name: 'slug', type: 'text', nullable: true, unique: true })
	slug: string | null;

	@Column({ name: 'meta_description', type: 'text', nullable: true })
	metaDescription: string | null;

	@Column({ name: 'phone', type: 'text', nullable: true })
	phone: string | null;

	@Column({ name: 'website', type: 'text', nullable: true })
	website: string | null;

	@Column({ name: 'email', type: 'text', nullable: true })
	email: string | null;

	@Column({ name: 'is_published', type: 'boolean', default: false })
	isPublished: boolean;

	@Column({ name: 'version', type: 'int', default: 0 })
	version: number;

	// uq_gp_user / uq_gp_org: UNIQUE FK → OneToOne, not ManyToOne
	// One green profile per user OR per org (mutually exclusive via chk_gp_owner)
	@OneToOne(() => User, { onDelete: 'CASCADE', nullable: true })
	@JoinColumn({ name: 'user_id' })
	user: User | null;

	@OneToOne(() => Organization, { onDelete: 'CASCADE', nullable: true })
	@JoinColumn({ name: 'organization_id' })
	organization: Organization | null;

	@OneToMany(() => Certification, (certification) => certification.greenProfile)
	certifications: Certification[];

	@OneToMany(() => Product, (product) => product.greenProfile)
	products: Product[];

	// Virtual — populated by service after loading, not a DB column
	avatarUrl?: string | null;
	photoMedias?: Pick<
		Media,
		'id' | 'cdnUrl' | 'thumbnailUrl' | 'mimeType' | 'widthPx' | 'heightPx'
	>[];
	videoMedias?: Pick<Media, 'id' | 'cdnUrl' | 'mimeType'>[];
}
