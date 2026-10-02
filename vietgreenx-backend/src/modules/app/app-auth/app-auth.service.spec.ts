import * as bcrypt from 'bcrypt';
import { Test, TestingModule } from '@nestjs/testing';
import { getEntityManagerToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AppAuthService } from './app-auth.service';
import { UserRepository } from '@app/database/typeorm/repositories/user.repository';
import { UserSessionRepository } from '@app/database/typeorm/repositories/user-session.repository';
import { FcmDeviceRepository } from '@app/database/typeorm/repositories/fcm-device.repository';
import { RedisService } from '@app/services/redis/redis.service';
import { OtpService } from '@app/services/otp/otp.service';
import { StatsService } from '@app/modules/app/stats/stats.service';
import { createUser } from '@app/__tests__/factories/user.factory';
import { createMockRedisService } from '@app/__tests__/helpers/mock-redis.service';
import { UserStatus } from '@app/common/enums/user-status.enum';
import { HttpBadRequestError } from '@app/common/errors';

const buildSession = (overrides = {}) => ({
	id: 'session-id-1',
	userId: 'user-id-1',
	tokenHash: 'hashed-refresh-token',
	revokedAt: null,
	expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
	...overrides,
});

const createMockEntityManager = () => ({
	transaction: jest.fn(),
	findOne: jest.fn(),
	create: jest.fn(),
	save: jest.fn(),
});

describe('AppAuthService — auth flow integration', () => {
	let service: AppAuthService;
	let userRepository: any;
	let otpService: any;
	let redisService: ReturnType<typeof createMockRedisService>;
	let jwtService: any;
	let entityManager: any;
	let userSessionRepository: any;

	beforeEach(async () => {
		redisService = createMockRedisService();
		userRepository = {
			findOne: jest.fn().mockResolvedValue(null),
			update: jest.fn().mockResolvedValue(undefined),
			executeInTransaction: jest.fn(),
			exists: jest.fn().mockResolvedValue(false),
		};
		otpService = {
			sendPhoneOtp: jest.fn().mockResolvedValue({ devOtp: '000000' }),
			verifyPhoneOtp: jest.fn().mockResolvedValue(undefined),
			sendEmailVerificationToken: jest.fn().mockResolvedValue(undefined),
			verifyEmailToken: jest.fn().mockResolvedValue('test@example.com'),
			sendEmailOtp: jest.fn().mockResolvedValue({ devOtp: '000000' }),
			verifyEmailOtp: jest.fn().mockResolvedValue(undefined),
		};
		jwtService = {
			sign: jest.fn().mockReturnValue('mock-access-token'),
			signAsync: jest.fn().mockResolvedValue('mock-access-token'),
			verify: jest.fn().mockReturnValue({ sub: 'user-id-1' }),
		};
		entityManager = createMockEntityManager();
		userSessionRepository = {
			findOne: jest.fn().mockResolvedValue(null),
			create: jest.fn().mockResolvedValue({ id: 'session-1' }),
			update: jest.fn().mockResolvedValue(undefined),
			executeInTransaction: jest.fn(),
		};

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				AppAuthService,
				{ provide: UserRepository, useValue: userRepository },
				{ provide: UserSessionRepository, useValue: userSessionRepository },
				{ provide: FcmDeviceRepository, useValue: { upsert: jest.fn() } },
				{ provide: RedisService, useValue: redisService },
				{ provide: OtpService, useValue: otpService },
				{
					provide: StatsService,
					useValue: { invalidatePublicStatsCache: jest.fn() },
				},
				{ provide: JwtService, useValue: jwtService },
				{
					provide: ConfigService,
					useValue: {
						get: jest.fn().mockReturnValue('http://localhost:3000'),
						getOrThrow: jest.fn().mockReturnValue('900s'),
					},
				},
				{
					provide: getEntityManagerToken(),
					useValue: entityManager,
				},
			],
		}).compile();

		service = module.get<AppAuthService>(AppAuthService);
	});

	afterEach(() => jest.clearAllMocks());

	// ─── registerPhone ────────────────────────────────────────────────────────

	describe('registerPhone', () => {
		it('returns OTP message when phone is not yet registered', async () => {
			userRepository.findOne.mockResolvedValue(null);
			await service.registerPhone({
				phone: '0901234567',
				password: 'Password1!',
				displayName: 'Test User',
			} as any);
			expect(otpService.sendPhoneOtp).toHaveBeenCalledWith(
				expect.any(String),
				'register',
			);
		});

		it('throws when phone already exists', async () => {
			userRepository.findOne.mockResolvedValue(createUser());
			await expect(
				service.registerPhone({
					phone: '0901234567',
					password: 'pw',
					displayName: 'd',
				} as any),
			).rejects.toThrow(HttpBadRequestError);
		});

		it('includes devOtp in response (dev environment)', async () => {
			userRepository.findOne.mockResolvedValue(null);
			otpService.sendPhoneOtp.mockResolvedValue({ devOtp: '000000' });
			const result = await service.registerPhone({
				phone: '0901234567',
				password: 'Password1!',
				displayName: 'Test User',
			} as any);
			expect(result?.devOtp).toBe('000000');
		});
	});

	// ─── verifyPhoneOtp ───────────────────────────────────────────────────────

	describe('verifyPhoneOtp', () => {
		it('issues tokens after successful OTP verification', async () => {
			const savedUser = createUser({ id: 'user-id-1' });
			entityManager.transaction.mockImplementation(async (cb: any) => {
				const mockManager = {
					findOne: jest.fn().mockResolvedValue(null),
					create: jest.fn().mockImplementation((Entity, data) => ({ ...data })),
					save: jest.fn().mockResolvedValue(savedUser),
				};
				return cb(mockManager);
			});
			userSessionRepository.create = jest
				.fn()
				.mockResolvedValue({ id: 'session-1' });

			const result = await service.verifyPhoneOtp({
				phone: '0901234567',
				otp: '000000',
				password: 'Password1!',
				displayName: 'Test User',
				role: 'consumer',
			} as any);

			expect(otpService.verifyPhoneOtp).toHaveBeenCalled();
			expect(result).toHaveProperty('accessToken');
		});

		it('throws when OTP is invalid', async () => {
			otpService.verifyPhoneOtp.mockRejectedValue(new Error('OTP_INVALID'));
			await expect(
				service.verifyPhoneOtp({
					phone: '0901234567',
					otp: 'bad',
					password: 'pw',
					displayName: 'd',
				} as any),
			).rejects.toThrow(HttpBadRequestError);
		});

		it('throws when phone is already taken inside transaction', async () => {
			const existingUser = createUser();
			entityManager.transaction.mockImplementation(async (cb: any) => {
				const mockManager = {
					findOne: jest.fn().mockResolvedValue(existingUser),
					create: jest.fn(),
					save: jest.fn(),
				};
				return cb(mockManager);
			});
			await expect(
				service.verifyPhoneOtp({
					phone: '0901234567',
					otp: '000000',
					password: 'pw',
					displayName: 'd',
				} as any),
			).rejects.toThrow(HttpBadRequestError);
		});
	});

	// ─── login ────────────────────────────────────────────────────────────────

	describe('login', () => {
		it('throws LOGIN_ACCOUNT_LOCKED when account is locked', async () => {
			redisService.exists.mockResolvedValue(true);
			await expect(
				service.login({
					identifier: 'test@example.com',
					password: 'pw',
				} as any),
			).rejects.toThrow(HttpBadRequestError);
		});

		it('throws INCORRECT_LOGIN_INFO when user not found', async () => {
			redisService.exists.mockResolvedValue(false);
			userRepository.findOne.mockResolvedValue(null);
			await expect(
				service.login({
					identifier: 'notfound@example.com',
					password: 'pw',
				} as any),
			).rejects.toThrow(HttpBadRequestError);
		});

		it('throws INCORRECT_LOGIN_INFO when password is wrong', async () => {
			redisService.exists.mockResolvedValue(false);
			const hash = await bcrypt.hash('correct-password', 10);
			userRepository.findOne.mockResolvedValue(
				createUser({ passwordHash: hash }),
			);
			await expect(
				service.login({
					identifier: 'test@example.com',
					password: 'wrong-password',
				} as any),
			).rejects.toThrow(HttpBadRequestError);
		});

		it('throws USER_IN_ACTIVE when user is not active', async () => {
			redisService.exists.mockResolvedValue(false);
			const hash = await bcrypt.hash('pw', 10);
			userRepository.findOne.mockResolvedValue(
				createUser({ passwordHash: hash, status: UserStatus.DEACTIVATED }),
			);
			await expect(
				service.login({
					identifier: 'test@example.com',
					password: 'pw',
				} as any),
			).rejects.toThrow(HttpBadRequestError);
		});

		it('returns tokens on valid credentials', async () => {
			redisService.exists.mockResolvedValue(false);
			const hash = await bcrypt.hash('correct-pw', 10);
			const user = createUser({
				passwordHash: hash,
				status: UserStatus.ACTIVE,
			});
			userRepository.findOne.mockResolvedValue(user);
			userSessionRepository.create = jest
				.fn()
				.mockResolvedValue({ id: 'session-1' });

			const result = await service.login({
				identifier: 'test@example.com',
				password: 'correct-pw',
			} as any);

			expect(result).toHaveProperty('accessToken');
			expect(result).toHaveProperty('refreshToken');
		});

		it('clears failed login attempts on successful login', async () => {
			redisService.exists.mockResolvedValue(false);
			const hash = await bcrypt.hash('pw', 10);
			userRepository.findOne.mockResolvedValue(
				createUser({ passwordHash: hash }),
			);
			userSessionRepository.create = jest.fn().mockResolvedValue({ id: 's1' });

			await service.login({
				identifier: 'test@example.com',
				password: 'pw',
			} as any);

			expect(redisService.del).toHaveBeenCalledWith(
				expect.stringContaining('login_attempts:'),
			);
		});
	});

	// ─── logout ───────────────────────────────────────────────────────────────

	describe('logout', () => {
		it('revokes the session and returns success message', async () => {
			userSessionRepository.executeInTransaction = jest
				.fn()
				.mockResolvedValue(undefined);
			const result = await service.logout({
				refreshToken: 'some-refresh-token',
			} as any);
			expect(result).toBeNull();
		});

		it('returns success even when session is not found (idempotent)', async () => {
			userSessionRepository.findOne.mockResolvedValue(null);
			const result = await service.logout({
				refreshToken: 'unknown-token',
			} as any);
			expect(result).toBeNull();
			expect(userSessionRepository.update).not.toHaveBeenCalled();
		});
	});

	// ─── refreshToken ─────────────────────────────────────────────────────────

	describe('refreshToken', () => {
		it('throws UNAUTHORIZED when refresh token does not exist', async () => {
			userSessionRepository.executeInTransaction = jest
				.fn()
				.mockImplementation(async (cb: any) => {
					const mockManager = {
						getRepository: jest.fn().mockReturnValue({
							createQueryBuilder: jest.fn().mockReturnValue({
								setLock: jest.fn().mockReturnThis(),
								where: jest.fn().mockReturnThis(),
								getOne: jest.fn().mockResolvedValue(null),
							}),
						}),
					};
					return cb(mockManager);
				});

			await expect(
				service.refreshToken({ refreshToken: 'invalid-token' } as any),
			).rejects.toThrow();
		});

		it('throws UNAUTHORIZED when session is revoked', async () => {
			const revokedSession = buildSession({ revokedAt: new Date() });
			userSessionRepository.executeInTransaction = jest
				.fn()
				.mockImplementation(async (cb: any) => {
					const mockManager = {
						getRepository: jest.fn().mockReturnValue({
							createQueryBuilder: jest.fn().mockReturnValue({
								setLock: jest.fn().mockReturnThis(),
								where: jest.fn().mockReturnThis(),
								getOne: jest.fn().mockResolvedValue(revokedSession),
							}),
						}),
					};
					return cb(mockManager);
				});

			await expect(
				service.refreshToken({ refreshToken: 'revoked-token' } as any),
			).rejects.toThrow();
		});

		it('throws UNAUTHORIZED when session is expired', async () => {
			const expiredSession = buildSession({
				expiresAt: new Date(Date.now() - 1000),
			});
			userSessionRepository.executeInTransaction = jest
				.fn()
				.mockImplementation(async (cb: any) => {
					const mockManager = {
						getRepository: jest.fn().mockReturnValue({
							createQueryBuilder: jest.fn().mockReturnValue({
								setLock: jest.fn().mockReturnThis(),
								where: jest.fn().mockReturnThis(),
								getOne: jest.fn().mockResolvedValue(expiredSession),
							}),
						}),
					};
					return cb(mockManager);
				});

			await expect(
				service.refreshToken({ refreshToken: 'expired-token' } as any),
			).rejects.toThrow();
		});

		it('returns new access and refresh tokens on valid session', async () => {
			const user = createUser({ id: 'user-id-1', status: UserStatus.ACTIVE });
			const validSession = buildSession();
			userSessionRepository.executeInTransaction = jest
				.fn()
				.mockImplementation(async (cb: any) => {
					const mockManager = {
						getRepository: jest.fn().mockReturnValue({
							createQueryBuilder: jest.fn().mockReturnValue({
								setLock: jest.fn().mockReturnThis(),
								where: jest.fn().mockReturnThis(),
								getOne: jest.fn().mockResolvedValue(validSession),
							}),
						}),
						findOne: jest.fn().mockResolvedValue(user),
						save: jest.fn().mockResolvedValue(validSession),
					};
					return cb(mockManager);
				});
			userSessionRepository.create = jest
				.fn()
				.mockResolvedValue({ id: 'new-session' });

			const result = await service.refreshToken({
				refreshToken: 'valid-token',
			} as any);

			expect(result).toHaveProperty('accessToken');
			expect(result).toHaveProperty('refreshToken');
		});
	});

	// ─── forgotPassword ───────────────────────────────────────────────────────

	describe('forgotPassword', () => {
		it('throws when neither phone nor email is provided', async () => {
			await expect(service.forgotPassword({} as any)).rejects.toThrow(
				HttpBadRequestError,
			);
		});

		it('returns null when phone not found (no user enumeration)', async () => {
			userRepository.findOne.mockResolvedValue(null);
			const result = await service.forgotPassword({
				phone: '0901234567',
			} as any);
			expect(result).toBeNull();
			expect(otpService.sendPhoneOtp).not.toHaveBeenCalled();
		});

		it('sends phone OTP when user exists with that phone', async () => {
			userRepository.findOne.mockResolvedValue(
				createUser({ phone: '+84901234567' }),
			);
			otpService.sendPhoneOtp.mockResolvedValue({ devOtp: '000000' });

			const result = await service.forgotPassword({
				phone: '0901234567',
			} as any);

			expect(otpService.sendPhoneOtp).toHaveBeenCalledWith(
				expect.any(String),
				'forgot',
			);
			expect(result?.devOtp).toBe('000000');
		});

		it('returns null when email not found (no user enumeration)', async () => {
			userRepository.findOne.mockResolvedValue(null);
			const result = await service.forgotPassword({
				email: 'notfound@test.com',
			} as any);
			expect(result).toBeNull();
			expect(otpService.sendEmailOtp).not.toHaveBeenCalled();
		});

		it('sends email OTP when user exists with that email', async () => {
			userRepository.findOne.mockResolvedValue(
				createUser({ email: 'user@test.com' }),
			);
			otpService.sendEmailOtp.mockResolvedValue({ devOtp: '000000' });

			await service.forgotPassword({ email: 'user@test.com' } as any);

			expect(otpService.sendEmailOtp).toHaveBeenCalledWith(
				'user@test.com',
				'forgot',
			);
		});
	});

	// ─── resetPassword ────────────────────────────────────────────────────────

	describe('resetPassword', () => {
		it('throws when neither phone nor email is provided', async () => {
			await expect(
				service.resetPassword({
					otp: '123456',
					newPassword: 'New@1234',
				} as any),
			).rejects.toThrow(HttpBadRequestError);
		});

		it('throws when OTP is invalid', async () => {
			otpService.verifyPhoneOtp.mockRejectedValue(new Error('OTP_INVALID'));
			await expect(
				service.resetPassword({
					phone: '0901234567',
					otp: 'wrong',
					newPassword: 'New@1234',
				} as any),
			).rejects.toThrow(HttpBadRequestError);
		});

		it('throws NEW_PASSWORD_SAME_AS_CURRENT when new password matches old', async () => {
			const currentHash = await bcrypt.hash('SamePassword@1', 10);
			const user = createUser({ passwordHash: currentHash });
			otpService.verifyEmailOtp.mockResolvedValue(undefined);
			userRepository.findOne.mockResolvedValue(user);
			// checkPasswordHistory — mock to do nothing
			redisService.get.mockResolvedValue(null);

			await expect(
				service.resetPassword({
					email: 'user@test.com',
					otp: '000000',
					newPassword: 'SamePassword@1',
				} as any),
			).rejects.toThrow(HttpBadRequestError);
		});

		it('resets password and revokes all sessions on success (via phone)', async () => {
			const user = createUser({ id: 'user-id-1', passwordHash: undefined });
			otpService.verifyPhoneOtp.mockResolvedValue(undefined);
			userRepository.findOne.mockResolvedValue(user);
			redisService.get.mockResolvedValue(null);

			userRepository.executeInTransaction = jest
				.fn()
				.mockImplementation(async (cb: any) => {
					const mockManager = {
						createQueryBuilder: jest.fn().mockReturnValue({
							update: jest.fn().mockReturnThis(),
							set: jest.fn().mockReturnThis(),
							where: jest.fn().mockReturnThis(),
							execute: jest.fn().mockResolvedValue({}),
						}),
					};
					return cb(mockManager);
				});
			userSessionRepository.bulkUpdate = jest.fn().mockResolvedValue(undefined);

			const result = await service.resetPassword({
				phone: '0901234567',
				otp: '000000',
				newPassword: 'NewSecure@123',
			} as any);

			expect(result).toBeNull();
			expect(userRepository.executeInTransaction).toHaveBeenCalled();
			expect(userSessionRepository.bulkUpdate).toHaveBeenCalledWith(
				{ userId: user.id },
				expect.objectContaining({ revokedAt: expect.any(Date) }),
			);
		});
	});

	// ─── incrementLoginAttempt (private — tested via login behaviour) ─────────

	describe('login attempt locking', () => {
		it('locks account after 5 failed attempts', async () => {
			redisService.exists.mockResolvedValue(false);
			userRepository.findOne.mockResolvedValue(null);

			redisService.incr
				.mockResolvedValueOnce(1)
				.mockResolvedValueOnce(2)
				.mockResolvedValueOnce(3)
				.mockResolvedValueOnce(4)
				.mockResolvedValueOnce(5);

			for (let i = 0; i < 5; i++) {
				await service
					.login({ identifier: 'test@test.com', password: 'wrong' } as any)
					.catch(() => {});
			}

			expect(redisService.set).toHaveBeenCalledWith(
				'login_lock:test@test.com',
				'1',
				expect.any(Number),
			);
		});

		it('sets TTL on first failed attempt', async () => {
			redisService.exists.mockResolvedValue(false);
			userRepository.findOne.mockResolvedValue(null);
			redisService.incr.mockResolvedValue(1);

			await service
				.login({ identifier: 'test@test.com', password: 'wrong' } as any)
				.catch(() => {});

			expect(redisService.expire).toHaveBeenCalledWith(
				'login_attempts:test@test.com',
				expect.any(Number),
			);
		});
	});

	// ─── checkUsername ────────────────────────────────────────────────────────

	describe('checkUsernameAvailability', () => {
		it('returns available: true when username is not taken', async () => {
			userRepository.exists.mockResolvedValue(false);
			const result = await service.checkUsernameAvailability('newuser');
			expect(result).toEqual({ available: true });
		});

		it('returns available: false when username is already taken', async () => {
			userRepository.exists.mockResolvedValue(true);
			const result = await service.checkUsernameAvailability('takenuser');
			expect(result).toEqual({ available: false });
		});
	});
});
