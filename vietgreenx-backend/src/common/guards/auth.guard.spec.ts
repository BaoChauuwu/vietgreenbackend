import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthGuard } from './auth.guard';
import { UserRepository } from '@app/database/typeorm/repositories/user.repository';
import { HttpUnauthorizedError } from '@app/common/errors';
import { createUser } from '@app/__tests__/factories/user.factory';
import { UserStatus } from '@app/common/enums/user-status.enum';
import { UserRole } from '@app/common/enums/user-role.enum';

const buildContext = (authHeader?: string): ExecutionContext => {
	const request = {
		headers: authHeader ? { authorization: authHeader } : {},
		user: undefined as any,
	};
	return {
		switchToHttp: () => ({ getRequest: () => request }),
	} as unknown as ExecutionContext;
};

describe('AuthGuard (admin)', () => {
	let guard: AuthGuard;
	let jwtService: { verify: jest.Mock };
	let userRepository: { findOne: jest.Mock };

	beforeEach(async () => {
		jwtService = { verify: jest.fn() };
		userRepository = { findOne: jest.fn() };

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				AuthGuard,
				{ provide: JwtService, useValue: jwtService },
				{ provide: UserRepository, useValue: userRepository },
			],
		}).compile();

		guard = module.get<AuthGuard>(AuthGuard);
	});

	afterEach(() => jest.clearAllMocks());

	it('throws when Authorization header is missing', async () => {
		await expect(guard.canActivate(buildContext())).rejects.toThrow(
			HttpUnauthorizedError,
		);
	});

	it('throws when Authorization scheme is not Bearer', async () => {
		await expect(
			guard.canActivate(buildContext('Basic token')),
		).rejects.toThrow(HttpUnauthorizedError);
	});

	it('throws when JWT verification fails', async () => {
		jwtService.verify.mockImplementation(() => {
			throw new Error('invalid signature');
		});
		await expect(
			guard.canActivate(buildContext('Bearer bad-token')),
		).rejects.toThrow(HttpUnauthorizedError);
	});

	it('throws when user is not found by email', async () => {
		jwtService.verify.mockReturnValue({ email: 'admin@test.com', v: 0 });
		userRepository.findOne.mockResolvedValue(null);
		await expect(
			guard.canActivate(buildContext('Bearer valid-token')),
		).rejects.toThrow(HttpUnauthorizedError);
	});

	it('throws when user is inactive', async () => {
		jwtService.verify.mockReturnValue({ email: 'admin@test.com', v: 0 });
		userRepository.findOne.mockResolvedValue(
			createUser({ status: UserStatus.DEACTIVATED }),
		);
		await expect(
			guard.canActivate(buildContext('Bearer valid-token')),
		).rejects.toThrow(HttpUnauthorizedError);
	});

	it('throws when token version is stale (v mismatch)', async () => {
		jwtService.verify.mockReturnValue({ email: 'admin@test.com', v: 0 });
		userRepository.findOne.mockResolvedValue(
			createUser({ status: UserStatus.ACTIVE, version: 2 }),
		);
		await expect(
			guard.canActivate(buildContext('Bearer stale-token')),
		).rejects.toThrow(HttpUnauthorizedError);
	});

	it('returns true and sets request.user for valid admin token', async () => {
		const admin = createUser({
			email: 'admin@test.com',
			role: UserRole.ADMIN,
			status: UserStatus.ACTIVE,
			version: 1,
		});
		jwtService.verify.mockReturnValue({ email: 'admin@test.com', v: 1 });
		userRepository.findOne.mockResolvedValue(admin);

		const ctx = buildContext('Bearer valid-token');
		const result = await guard.canActivate(ctx);

		expect(result).toBe(true);
		expect(ctx.switchToHttp().getRequest().user).toBe(admin);
	});

	it('allows token with no v field — no version check applied', async () => {
		const admin = createUser({
			email: 'admin@test.com',
			status: UserStatus.ACTIVE,
			version: 5,
		});
		jwtService.verify.mockReturnValue({ email: 'admin@test.com' });
		userRepository.findOne.mockResolvedValue(admin);

		const result = await guard.canActivate(buildContext('Bearer no-v-token'));
		expect(result).toBe(true);
	});
});
