import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { EntityHelper } from '@app/utils/entity-helper';

@Entity({ name: 'categories', schema: 'agriculture' })
@Index('idx_cat_parent', ['parentId'])
export class Category extends EntityHelper {
	@Column({ name: 'parent_id', type: 'uuid', nullable: true })
	parentId: string | null;

	@Column({ name: 'name_vi', type: 'text' })
	nameVi: string;

	@Column({ name: 'name_en', type: 'text' })
	nameEn: string;

	@Column({ name: 'slug', type: 'text', unique: true })
	slug: string;

	@Column({ name: 'icon_url', type: 'text', nullable: true })
	iconUrl: string | null;

	@Column({ name: 'sort_order', type: 'smallint', default: 0 })
	sortOrder: number;

	@Column({ name: 'is_active', type: 'boolean', default: true })
	isActive: boolean;

	@Column({ name: 'product_count', type: 'int', default: 0 })
	productCount: number;

	@ManyToOne(() => Category, { onDelete: 'RESTRICT', nullable: true })
	@JoinColumn({ name: 'parent_id' })
	parent: Category | null;
}
