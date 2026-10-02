import {
	Column,
	Entity,
	PrimaryGeneratedColumn,
	CreateDateColumn,
	UpdateDateColumn,
} from 'typeorm';
import { MembershipPlan } from '@app/common/enums/membership-plan.enum';

@Entity({ name: 'membership_tiers', schema: 'system' })
export class MembershipTier {
	@PrimaryGeneratedColumn('uuid', { name: 'id' })
	id: string;

	@Column({
		name: 'plan',
		type: 'text',
		unique: true,
		enum: MembershipPlan,
	})
	plan: MembershipPlan;

	@Column({ name: 'display_name', type: 'text' })
	displayName: string;

	@Column({ name: 'description', type: 'text', nullable: true })
	description: string | null;

	@Column({ name: 'price_monthly', type: 'numeric', precision: 12, scale: 0 })
	priceMonthly: number;

	@Column({
		name: 'price_yearly',
		type: 'numeric',
		precision: 12,
		scale: 0,
		nullable: true,
	})
	priceYearly: number | null;

	@Column({ name: 'qr_limit', type: 'int', default: 0 })
	qrLimit: number;

	@Column({ name: 'product_limit', type: 'int', default: 5 })
	productLimit: number;

	@Column({ name: 'trade_post_allowed', type: 'boolean', default: false })
	tradePostAllowed: boolean;

	@Column({ name: 'is_active', type: 'boolean', default: true })
	isActive: boolean;

	@Column({ name: 'sort_order', type: 'smallint', default: 0 })
	sortOrder: number;

	@CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
	createdAt: Date;

	@UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
	updatedAt: Date;
}
