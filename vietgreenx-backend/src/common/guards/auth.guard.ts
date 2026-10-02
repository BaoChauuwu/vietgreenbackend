import { JwtService } from '@nestjs/jwt';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

import { Request } from 'express';

import { HttpUnauthorizedError } from '@app/common/errors';
import { UserRepository } from '@app/database/typeorm/repositories/user.repository';
import { UserStatus } from '@app/common/enums/user-status.enum';
import { UserRole } from '@app/common/enums/user-role.enum';

@Injectable()
export class AuthGuard implements CanActivate {
	constructor(
		private jwtService: JwtService,
		private userRepository: UserRepository,
	) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const request = context.switchToHttp().getRequest();
		const token = this.extractTokenFromHeader(request);
		if (!token) {
			throw new HttpUnauthorizedError();
		}
		try {
			const decodeToken = this.jwtService.verify(token);
			const user = await this.userRepository.findOne({
				email: decodeToken.email,
			});
			if (
				!user ||
				user.status !== UserStatus.ACTIVE ||
				user.role !== UserRole.ADMIN
			) {
				throw new HttpUnauthorizedError();
			}
			if (decodeToken.v !== undefined && user.version !== decodeToken.v) {
				throw new HttpUnauthorizedError();
			}
			request.user = user;
		} catch {
			throw new HttpUnauthorizedError();
		}
		return true;
	}

	private extractTokenFromHeader(request: Request): string | undefined {
		const [type, token] = request.headers.authorization?.split(' ') ?? [];
		return type === 'Bearer' ? token : undefined;
	}
}
