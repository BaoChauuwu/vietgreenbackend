import { SetMetadata } from '@nestjs/common';
export interface RequiredPermission {
	resource: string;
	action: string;
}
export const PERMISSIONS_KEY = 'permissions';
export const CheckPermissions = (...permissions: RequiredPermission[]) =>
	SetMetadata(PERMISSIONS_KEY, permissions);
