import { SetMetadata } from '@nestjs/common';
import { MembershipPlan } from '@app/common/enums/membership-plan.enum';

export const REQUIRED_PLAN_KEY = 'required_plan';

export const RequiredPlan = (plan: MembershipPlan) =>
	SetMetadata(REQUIRED_PLAN_KEY, plan);
