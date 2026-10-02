import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { MembershipPlan } from '@app/common/enums/membership-plan.enum';
import { HttpForbiddenError } from '@app/common/errors';
import { ErrorCode } from '@app/common/errors/error-code';
import { REQUIRED_PLAN_KEY } from '@app/common/decorators/required-plan.decorator';

const PLAN_RANK: Record<MembershipPlan, number> = {
	[MembershipPlan.FREE]: 0,
	[MembershipPlan.SELLER]: 1,
	[MembershipPlan.COOPERATIVE_ENTERPRISE]: 2,
};

@Injectable()
export class PlanGuard implements CanActivate {
	constructor(private readonly reflector: Reflector) {}

	canActivate(context: ExecutionContext): boolean {
		const requiredPlan = this.reflector.getAllAndOverride<MembershipPlan>(
			REQUIRED_PLAN_KEY,
			[context.getClass(), context.getHandler()],
		);
		if (!requiredPlan) {
			return true;
		}

		const request = context.switchToHttp().getRequest();
		const user = request.user;
		if (!user) {
			throw new HttpForbiddenError(ErrorCode.PLAN_REQUIRED);
		}

		const userPlan: MembershipPlan = user.plan ?? MembershipPlan.FREE;
		const planExpired =
			user.planExpiresAt != null && new Date(user.planExpiresAt) < new Date();

		const effectivePlan =
			planExpired && userPlan !== MembershipPlan.FREE
				? MembershipPlan.FREE
				: userPlan;

		if (PLAN_RANK[effectivePlan] < PLAN_RANK[requiredPlan]) {
			throw new HttpForbiddenError(ErrorCode.PLAN_REQUIRED);
		}

		return true;
	}
}
