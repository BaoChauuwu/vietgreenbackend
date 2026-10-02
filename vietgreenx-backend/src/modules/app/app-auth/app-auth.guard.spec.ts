import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AppAuthGuard } from './app-auth.guard';
import { UserRepository } from '@app/database/typeorm/repositories/user.repository';
import { HttpUnauthorizedError } from '@app/common/errors';
import { createUser } from '@app/__tests__/factories/user.factory';
import { UserStatus } from '@app/common/enums/user-status.enum';

const buildContext = (authHeader?: string): ExecutionContext => {
	const request = {
		headers: authHeader ? { authorization: authHeader } : {},
		user: undefined as any,
	};
	return {
		switchToHttp: () => ({ getRequest: () => request }),
	} as unknown as ExecutionContext;
};

describe('AppAuthGuard', () => {
	let guard: AppAuthGuard;
	let jwtService: { verify: jest.Mock };
	let userRepository: { findById: jest.Mock };

	beforeEach(async () => {
		jwtService = { verify: jest.fn() };
		userRepository = { findById: jest.fn() };

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				AppAuthGuard,
				{ provide: JwtService, useValue: jwtService },
				{ provide: UserRepository, useValue: userRepository },
			],
		}).compile();

		guard = module.get<AppAuthGuard>(AppAuthGuard);
	});

	afterEach(() => jest.clearAllMocks());

	it('throws when Authorization header is missing', async () => {
		await expect(guard.canActivate(buildContext())).rejects.toThrow(
			HttpUnauthorizedError,
		);
	});

	it('throws when Authorization scheme is not Bearer', async () => {
		await expect(
			guard.canActivate(buildContext('Basic sometoken')),
		).rejects.toThrow(HttpUnauthorizedError);
	});

	it('throws when JWT is invalid / expired', async () => {
		jwtService.verify.mockImplementation(() => {
			throw new Error('jwt expired');
		});
		await expect(
			guard.canActivate(buildContext('Bearer bad-token')),
		).rejects.toThrow(HttpUnauthorizedError);
	});

	it('throws when payload has no sub', async () => {
		jwtService.verify.mockReturnValue({ role: 'consumer' });
		await expect(
			guard.canActivate(buildContext('Bearer valid-token')),
		).rejects.toThrow(HttpUnauthorizedError);
	});

	it('throws when user is not found in DB', async () => {
		jwtService.verify.mockReturnValue({ sub: 'user-id', v: 0 });
		userRepository.findById.mockResolvedValue(null);
		await expect(
			guard.canActivate(buildContext('Bearer valid-token')),
		).rejects.toThrow(HttpUnauthorizedError);
	});

	it('throws when user is inactive', async () => {
		jwtService.verify.mockReturnValue({ sub: 'user-id', v: 0 });
		userRepository.findById.mockResolvedValue(
			createUser({ status: UserStatus.DEACTIVATED }),
		);
		await expect(
			guard.canActivate(buildContext('Bearer valid-token')),
		).rejects.toThrow(HttpUnauthorizedError);
	});

	it('throws when token version does not match user version', async () => {
		jwtService.verify.mockReturnValue({ sub: 'user-id', v: 0 });
		userRepository.findById.mockResolvedValue(
			createUser({ status: UserStatus.ACTIVE, version: 3 }),
		);
		await expect(
			guard.canActivate(buildContext('Bearer stale-token')),
		).rejects.toThrow(HttpUnauthorizedError);
	});

	it('returns true and sets request.user for valid token', async () => {
		const user = createUser({ status: UserStatus.ACTIVE, version: 1 });
		jwtService.verify.mockReturnValue({ sub: user.id, v: 1 });
		userRepository.findById.mockResolvedValue(user);

		const ctx = buildContext('Bearer valid-token');
		const result = await guard.canActivate(ctx);

		expect(result).toBe(true);
		expect(ctx.switchToHttp().getRequest()['user']).toBe(user);
	});

	it('allows token with no v field (backwards compat — no version check)', async () => {
		const user = createUser({ status: UserStatus.ACTIVE, version: 5 });
		jwtService.verify.mockReturnValue({ sub: user.id });
		userRepository.findById.mockResolvedValue(user);

		const result = await guard.canActivate(
			buildContext('Bearer no-version-token'),
		);
		expect(result).toBe(true);
	});
});
