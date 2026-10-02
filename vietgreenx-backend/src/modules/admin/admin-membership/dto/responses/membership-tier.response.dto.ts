import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import { MembershipPlan } from '@app/common/enums/membership-plan.enum';

@Exclude()
export class MembershipTierResponseDto {
	@ApiProperty()
	@Expose()
	id: string;

	@ApiProperty({ enum: MembershipPlan })
	@Expose()
	plan: MembershipPlan;

	@ApiProperty()
	@Expose()
	displayName: string;

	@ApiPropertyOptional({ nullable: true })
	@Expose()
	description: string | null;

	@ApiProperty()
	@Expose()
	priceMonthly: number;

	@ApiPropertyOptional({ nullable: true })
	@Expose()
	priceYearly: number | null;

	@ApiProperty()
	@Expose()
	qrLimit: number;

	@ApiProperty()
	@Expose()
	productLimit: number;

	@ApiProperty()
	@Expose()
	tradePostAllowed: boolean;

	@ApiProperty()
	@Expose()
	isActive: boolean;

	@ApiProperty()
	@Expose()
	sortOrder: number;

	@ApiProperty()
	@Expose()
	createdAt: Date;

	@ApiProperty()
	@Expose()
	updatedAt: Date;
}
