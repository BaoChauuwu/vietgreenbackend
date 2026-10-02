import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { HttpForbiddenError } from '@app/common/errors';

@Injectable()
export class RolesGuard implements CanActivate {
	constructor(private reflector: Reflector) {}

	canActivate(context: ExecutionContext): boolean {
		const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
			context.getClass(),
			context.getHandler(),
		]);
		if (!requiredRoles || !requiredRoles.length) {
			return true;
		}

		const request = context.switchToHttp().getRequest();
		const userRole = request.user?.role;
		const hasPermission = requiredRoles.includes(userRole);
		if (!hasPermission) {
			throw new HttpForbiddenError();
		}

		return true;
	}
}
