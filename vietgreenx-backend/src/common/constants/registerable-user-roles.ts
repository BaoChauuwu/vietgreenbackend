import { UserRole } from '@app/common/enums/user-role.enum';

export const REGISTERABLE_USER_ROLES = [
	UserRole.CONSUMER,
	UserRole.SELLER,
	UserRole.COOPERATIVE,
	UserRole.ENTERPRISE,
	UserRole.EXPERT,
] as const;

export type RegisterableUserRole = (typeof REGISTERABLE_USER_ROLES)[number];
