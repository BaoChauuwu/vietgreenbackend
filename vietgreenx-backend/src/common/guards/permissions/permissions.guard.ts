import {
	PERMISSIONS_KEY,
	RequiredPermission,
} from '@app/common/decorators/permissions.decorator';
import { HttpForbiddenError, ErrorCode } from '@app/common/errors';
import { RbacService } from '@app/modules/rbac/rbac.service';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class PermissionsGuard implements CanActivate {
	constructor(
		private readonly reflector: Reflector,
		private readonly rbacService: RbacService,
	) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const requiredPermission = this.reflector.getAllAndOverride<
			RequiredPermission[]
		>(PERMISSIONS_KEY, [context.getClass(), context.getHandler()]);

		if (!requiredPermission || requiredPermission.length === 0) {
			return true;
		}

		const request = context.switchToHttp().getRequest();
		const user = request.user;
		if (!user || !user.role) {
			throw new HttpForbiddenError(ErrorCode.NOT_PERMITTED_ROLE);
		}

		const userPermissions = await this.rbacService.getPermissionsForRole(
			user.role,
		);

		const hasAllPermissions = requiredPermission.every((permission) =>
			userPermissions.includes(`${permission.resource}:${permission.action}`),
		);

		if (!hasAllPermissions) {
			throw new HttpForbiddenError(ErrorCode.INVALID_PERMISSION);
		}

		return true;
	}
}
