import { MembershipPlan } from '@app/common/enums/membership-plan.enum';

export interface PlanFeatures {
	qrLimit: number;
	productLimit: number;
	tradePostAllowed: boolean;
}

export const PLAN_FEATURES: Record<MembershipPlan, PlanFeatures> = {
	[MembershipPlan.FREE]: {
		qrLimit: 0,
		productLimit: 5,
		tradePostAllowed: false,
	},
	[MembershipPlan.SELLER]: {
		qrLimit: 500,
		productLimit: 50,
		tradePostAllowed: true,
	},
	[MembershipPlan.COOPERATIVE_ENTERPRISE]: {
		qrLimit: 5000,
		productLimit: 500,
		tradePostAllowed: true,
	},
};
