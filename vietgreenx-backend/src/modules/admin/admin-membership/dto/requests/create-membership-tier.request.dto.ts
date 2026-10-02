import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
	IsBoolean,
	IsEnum,
	IsInt,
	IsNotEmpty,
	IsNumber,
	IsOptional,
	IsString,
	Min,
} from 'class-validator';
import { MembershipPlan } from '@app/common/enums/membership-plan.enum';

export class CreateMembershipTierRequestDto {
	@ApiProperty({ enum: MembershipPlan, example: MembershipPlan.SELLER })
	@IsEnum(MembershipPlan)
	plan: MembershipPlan;

	@ApiProperty({ example: 'Seller Plan' })
	@IsString()
	@IsNotEmpty()
	displayName: string;

	@ApiPropertyOptional({
		example: 'For small businesses and individual farmers',
	})
	@IsOptional()
	@IsString()
	description?: string;

	@ApiProperty({ example: 199000, description: 'Monthly price (VND)' })
	@IsNumber()
	@Min(0)
	priceMonthly: number;

	@ApiPropertyOptional({ example: 1990000, description: 'Yearly price (VND)' })
	@IsOptional()
	@IsNumber()
	@Min(0)
	priceYearly?: number;

	@ApiProperty({ example: 500 })
	@IsInt()
	@Min(0)
	qrLimit: number;

	@ApiProperty({ example: 50 })
	@IsInt()
	@Min(0)
	productLimit: number;

	@ApiProperty({ example: true })
	@IsBoolean()
	tradePostAllowed: boolean;

	@ApiPropertyOptional({ example: 1 })
	@IsOptional()
	@IsInt()
	@Min(0)
	sortOrder?: number;
}
