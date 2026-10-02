import { MembershipPlan } from '@app/common/enums/membership-plan.enum';
import { PlanFeatures } from '@app/common/constants/plan-limits.constant';

export class MembershipPlanResponseDto {
	plan: MembershipPlan;
	originalPlan: MembershipPlan;
	planExpiresAt: Date | null;
	isExpired: boolean;
	features: PlanFeatures;
}
