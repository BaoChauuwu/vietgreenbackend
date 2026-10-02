import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { HttpUnauthorizedError } from '@app/common/errors';
import { UserRepository } from '@app/database/typeorm/repositories/user.repository';
import { UserStatus } from '@app/common/enums/user-status.enum';

@Injectable()
export class AppAuthGuard implements CanActivate {
	constructor(
		private readonly jwtService: JwtService,
		private readonly userRepository: UserRepository,
	) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const request = context.switchToHttp().getRequest<Request>();
		const token = this.extractTokenFromHeader(request);
		if (!token) throw new HttpUnauthorizedError();

		let payload: { sub: string; role: string; v?: number };
		try {
			payload = this.jwtService.verify(token);
		} catch {
			throw new HttpUnauthorizedError();
		}

		if (!payload?.sub) throw new HttpUnauthorizedError();

		const user = await this.userRepository.findById(payload.sub);
		if (!user || user.status !== UserStatus.ACTIVE) {
			throw new HttpUnauthorizedError();
		}

		if (payload.v !== undefined && user.version !== payload.v) {
			throw new HttpUnauthorizedError();
		}

		request['user'] = user;
		return true;
	}

	private extractTokenFromHeader(request: Request): string | undefined {
		const [type, token] = request.headers.authorization?.split(' ') ?? [];
		return type === 'Bearer' ? token : undefined;
	}
}
