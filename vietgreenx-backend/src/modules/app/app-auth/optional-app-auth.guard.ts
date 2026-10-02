import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { UserRepository } from '@app/database/typeorm/repositories/user.repository';
import { UserStatus } from '@app/common/enums/user-status.enum';

@Injectable()
export class OptionalAppAuthGuard implements CanActivate {
	constructor(
		private readonly jwtService: JwtService,
		private readonly userRepository: UserRepository,
	) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const request = context.switchToHttp().getRequest<Request>();
		const token = this.extractTokenFromHeader(request);
		if (!token) {
			return true;
		}

		try {
			const payload = this.jwtService.verify<{ sub: string; v?: number }>(
				token,
			);
			if (!payload?.sub) {
				return true;
			}

			const user = await this.userRepository.findById(payload.sub);
			if (
				!user ||
				user.status !== UserStatus.ACTIVE ||
				(payload.v !== undefined && user.version !== payload.v)
			) {
				return true;
			}

			request['user'] = user;
		} catch {
			// Treat invalid/expired tokens as anonymous for public endpoints.
		}

		return true;
	}

	private extractTokenFromHeader(request: Request): string | undefined {
		const [type, token] = request.headers.authorization?.split(' ') ?? [];
		return type === 'Bearer' ? token : undefined;
	}
}
