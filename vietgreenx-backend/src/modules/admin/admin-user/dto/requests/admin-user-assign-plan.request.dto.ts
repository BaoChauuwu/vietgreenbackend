import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsISO8601, IsOptional } from 'class-validator';
import { MembershipPlan } from '@app/common/enums/membership-plan.enum';

export class AdminUserAssignPlanRequestDto {
	@ApiProperty({ enum: MembershipPlan, example: MembershipPlan.SELLER })
	@IsEnum(MembershipPlan)
	plan: MembershipPlan;

	@ApiPropertyOptional({
		description:
			'Plan expiry date (ISO 8601). Null means no expiry (lifetime).',
		example: '2027-01-01T00:00:00.000Z',
		nullable: true,
	})
	@IsOptional()
	@IsISO8601()
	expiresAt?: string | null;
}
