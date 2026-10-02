import * as bcrypt from 'bcrypt';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AdminAuthService } from './admin-auth.service';
import { UserRepository } from '@app/database/typeorm/repositories/user.repository';
import { EmailService } from '@app/services/email/email.service';
import { createUser } from '@app/__tests__/factories/user.factory';
import { createMockEmailService } from '@app/__tests__/helpers/mock-email.service';
import { UserStatus } from '@app/common/enums/user-status.enum';
import { UserRole } from '@app/common/enums/user-role.enum';
import { HttpBadRequestError } from '@app/common/errors';

const createMockUserRepository = () => ({
	findOne: jest.fn(),
	findById: jest.fn(),
	update: jest.fn().mockResolvedValue(undefined),
	executeInTransaction: jest.fn(),
});

const createMockConfigService = () => ({
	get: jest.fn().mockImplementation((key: string) => {
		if (key === 'auth.expires') return '900s';
		if (key === 'auth.secret') return 'test-secret';
		return undefined;
	}),
});

describe('AdminAuthService', () => {
	let service: AdminAuthService;
	let userRepository: ReturnType<typeof createMockUserRepository>;
	let emailService: ReturnType<typeof createMockEmailService>;
	let jwtService: any;

	beforeEach(async () => {
		userRepository = createMockUserRepository();
		emailService = createMockEmailService();
		jwtService = {
			signAsync: jest.fn().mockResolvedValue('mock-admin-token'),
		};

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				AdminAuthService,
				{ provide: UserRepository, useValue: userRepository },
				{ provide: EmailService, useValue: emailService },
				{ provide: JwtService, useValue: jwtService },
				{ provide: ConfigService, useValue: createMockConfigService() },
			],
		}).compile();

		service = module.get<AdminAuthService>(AdminAuthService);
	});

	afterEach(() => jest.clearAllMocks());

	// ─── login ────────────────────────────────────────────────────────────────

	describe('login', () => {
		it('throws when user not found', async () => {
			userRepository.findOne.mockResolvedValue(null);
			await expect(
				service.login({ email: 'notfound@admin.com', password: 'pw' }),
			).rejects.toThrow(HttpBadRequestError);
		});

		it('throws when user has no passwordHash', async () => {
			userRepository.findOne.mockResolvedValue(
				createUser({ passwordHash: undefined }),
			);
			await expect(
				service.login({ email: 'admin@test.com', password: 'pw' }),
			).rejects.toThrow(HttpBadRequestError);
		});

		it('throws when user is not an admin', async () => {
			const hash = await bcrypt.hash('pw', 10);
			userRepository.findOne.mockResolvedValue(
				createUser({ passwordHash: hash, role: UserRole.CONSUMER }),
			);
			await expect(
				service.login({ email: 'consumer@test.com', password: 'pw' }),
			).rejects.toThrow(HttpBadRequestError);
		});

		it('throws when password is wrong', async () => {
			const hash = await bcrypt.hash('correct-pw', 10);
			userRepository.findOne.mockResolvedValue(
				createUser({ passwordHash: hash, role: UserRole.ADMIN }),
			);
			await expect(
				service.login({ email: 'admin@test.com', password: 'wrong-pw' }),
			).rejects.toThrow(HttpBadRequestError);
		});

		it('throws when admin account is inactive', async () => {
			const hash = await bcrypt.hash('pw', 10);
			userRepository.findOne.mockResolvedValue(
				createUser({
					passwordHash: hash,
					role: UserRole.ADMIN,
					status: UserStatus.DEACTIVATED,
				}),
			);
			await expect(
				service.login({ email: 'admin@test.com', password: 'pw' }),
			).rejects.toThrow(HttpBadRequestError);
		});

		it('returns accessToken with v field in payload on success', async () => {
			const hash = await bcrypt.hash('pw', 10);
			const admin = createUser({
				passwordHash: hash,
				role: UserRole.ADMIN,
				status: UserStatus.ACTIVE,
				version: 3,
			});
			userRepository.findOne.mockResolvedValue(admin);

			const result = await service.login({
				email: 'admin@test.com',
				password: 'pw',
			});

			expect(result.accessToken).toBe('mock-admin-token');
			expect(jwtService.signAsync).toHaveBeenCalledWith(
				expect.objectContaining({ v: 3 }),
				expect.anything(),
			);
		});

		it('returns admin profile in response', async () => {
			const hash = await bcrypt.hash('pw', 10);
			const admin = createUser({
				passwordHash: hash,
				role: UserRole.ADMIN,
				status: UserStatus.ACTIVE,
				email: 'admin@test.com',
			});
			userRepository.findOne.mockResolvedValue(admin);

			const result = await service.login({
				email: 'admin@test.com',
				password: 'pw',
			});

			expect(result.profile).toBeDefined();
		});
	});

	// ─── changePassword ───────────────────────────────────────────────────────

	describe('changePassword', () => {
		it('throws when user not found', async () => {
			userRepository.findById.mockResolvedValue(null);
			await expect(
				service.changePassword('user-id', {
					oldPassword: 'old',
					newPassword: 'new',
				} as any),
			).rejects.toThrow(HttpBadRequestError);
		});

		it('throws when old password is incorrect', async () => {
			const hash = await bcrypt.hash('correct-old', 10);
			userRepository.findById.mockResolvedValue(
				createUser({ passwordHash: hash }),
			);

			await expect(
				service.changePassword('user-id', {
					oldPassword: 'wrong-old',
					newPassword: 'New@123',
				} as any),
			).rejects.toThrow(HttpBadRequestError);
		});

		it('bumps version atomically via QueryBuilder on success', async () => {
			const hash = await bcrypt.hash('old-pw', 10);
			userRepository.findById.mockResolvedValue(
				createUser({ id: 'user-id', passwordHash: hash }),
			);

			const mockQb = {
				update: jest.fn().mockReturnThis(),
				set: jest.fn().mockReturnThis(),
				where: jest.fn().mockReturnThis(),
				execute: jest.fn().mockResolvedValue({}),
			};
			userRepository.executeInTransaction.mockImplementation(
				async (cb: any) => {
					return cb({ createQueryBuilder: jest.fn().mockReturnValue(mockQb) });
				},
			);

			const result = await service.changePassword('user-id', {
				oldPassword: 'old-pw',
				newPassword: 'New@Secure1',
			} as any);

			expect(userRepository.executeInTransaction).toHaveBeenCalled();
			expect(mockQb.set).toHaveBeenCalledWith(
				expect.objectContaining({ version: expect.any(Function) }),
			);
			expect(result).toBeNull();
		});

		it('does NOT use direct update() — ensures token invalidation', async () => {
			const hash = await bcrypt.hash('old-pw', 10);
			userRepository.findById.mockResolvedValue(
				createUser({ passwordHash: hash }),
			);
			userRepository.executeInTransaction.mockImplementation(
				async (cb: any) => {
					return cb({
						createQueryBuilder: jest.fn().mockReturnValue({
							update: jest.fn().mockReturnThis(),
							set: jest.fn().mockReturnThis(),
							where: jest.fn().mockReturnThis(),
							execute: jest.fn().mockResolvedValue({}),
						}),
					});
				},
			);

			await service.changePassword('user-id', {
				oldPassword: 'old-pw',
				newPassword: 'New@1',
			} as any);

			expect(userRepository.update).not.toHaveBeenCalled();
		});
	});

	// ─── forgotPassword ───────────────────────────────────────────────────────

	describe('forgotPassword', () => {
		it('throws when email not found', async () => {
			userRepository.findOne.mockResolvedValue(null);
			await expect(
				service.forgotPassword({ email: 'notfound@admin.com' }),
			).rejects.toThrow(HttpBadRequestError);
		});

		it('throws when admin account is inactive', async () => {
			userRepository.findOne.mockResolvedValue(
				createUser({ status: UserStatus.DEACTIVATED }),
			);
			await expect(
				service.forgotPassword({ email: 'admin@test.com' }),
			).rejects.toThrow(HttpBadRequestError);
		});

		it('bumps version atomically so old tokens are invalidated', async () => {
			const admin = createUser({
				status: UserStatus.ACTIVE,
				email: 'admin@test.com',
			});
			userRepository.findOne.mockResolvedValue(admin);

			const mockQb = {
				update: jest.fn().mockReturnThis(),
				set: jest.fn().mockReturnThis(),
				where: jest.fn().mockReturnThis(),
				execute: jest.fn().mockResolvedValue({}),
			};
			userRepository.executeInTransaction.mockImplementation(
				async (cb: any) => {
					return cb({ createQueryBuilder: jest.fn().mockReturnValue(mockQb) });
				},
			);

			await service.forgotPassword({ email: 'admin@test.com' });

			expect(userRepository.executeInTransaction).toHaveBeenCalled();
			expect(mockQb.set).toHaveBeenCalledWith(
				expect.objectContaining({ version: expect.any(Function) }),
			);
		});

		it('does NOT use direct update() after password reset', async () => {
			const admin = createUser({
				status: UserStatus.ACTIVE,
				email: 'admin@test.com',
			});
			userRepository.findOne.mockResolvedValue(admin);
			userRepository.executeInTransaction.mockImplementation(
				async (cb: any) => {
					return cb({
						createQueryBuilder: jest.fn().mockReturnValue({
							update: jest.fn().mockReturnThis(),
							set: jest.fn().mockReturnThis(),
							where: jest.fn().mockReturnThis(),
							execute: jest.fn().mockResolvedValue({}),
						}),
					});
				},
			);

			await service.forgotPassword({ email: 'admin@test.com' });

			expect(userRepository.update).not.toHaveBeenCalled();
		});

		it('sends email with new password', async () => {
			const admin = createUser({
				status: UserStatus.ACTIVE,
				email: 'admin@test.com',
			});
			userRepository.findOne.mockResolvedValue(admin);
			userRepository.executeInTransaction.mockImplementation(
				async (cb: any) => {
					return cb({
						createQueryBuilder: jest.fn().mockReturnValue({
							update: jest.fn().mockReturnThis(),
							set: jest.fn().mockReturnThis(),
							where: jest.fn().mockReturnThis(),
							execute: jest.fn().mockResolvedValue({}),
						}),
					});
				},
			);

			await service.forgotPassword({ email: 'admin@test.com' });

			expect(emailService.sendMail).toHaveBeenCalledWith(
				expect.objectContaining({ to: 'admin@test.com' }),
			);
		});

		it('HTML-escapes the generated password before sending email', async () => {
			const admin = createUser({
				status: UserStatus.ACTIVE,
				email: 'admin@test.com',
			});
			userRepository.findOne.mockResolvedValue(admin);
			userRepository.executeInTransaction.mockImplementation(
				async (cb: any) => {
					return cb({
						createQueryBuilder: jest.fn().mockReturnValue({
							update: jest.fn().mockReturnThis(),
							set: jest.fn().mockReturnThis(),
							where: jest.fn().mockReturnThis(),
							execute: jest.fn().mockResolvedValue({}),
						}),
					});
				},
			);

			await service.forgotPassword({ email: 'admin@test.com' });

			const call = (emailService.sendMail as jest.Mock).mock.calls[0][0];
			expect(call.html).not.toMatch(/<script/i);
			expect(call.html).toContain('<p>');
		});

		it('returns success message', async () => {
			const admin = createUser({
				status: UserStatus.ACTIVE,
				email: 'admin@test.com',
			});
			userRepository.findOne.mockResolvedValue(admin);
			userRepository.executeInTransaction.mockImplementation(
				async (cb: any) => {
					return cb({
						createQueryBuilder: jest.fn().mockReturnValue({
							update: jest.fn().mockReturnThis(),
							set: jest.fn().mockReturnThis(),
							where: jest.fn().mockReturnThis(),
							execute: jest.fn().mockResolvedValue({}),
						}),
					});
				},
			);

			const result = await service.forgotPassword({ email: 'admin@test.com' });

			expect(result.message).toBeDefined();
		});
	});
});
