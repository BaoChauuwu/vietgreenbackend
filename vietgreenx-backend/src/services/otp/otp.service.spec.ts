import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { OtpService } from './otp.service';
import { RedisService } from '@app/services/redis/redis.service';
import { EmailService } from '@app/services/email/email.service';
import { UserRepository } from '@app/database/typeorm/repositories/user.repository';
import { createMockRedisService } from '@app/__tests__/helpers/mock-redis.service';
import { createMockEmailService } from '@app/__tests__/helpers/mock-email.service';
import { createUser } from '@app/__tests__/factories/user.factory';

const createMockUserRepository = () => ({
	findOne: jest.fn().mockResolvedValue(null),
});

const createMockConfigService = () => ({
	get: jest.fn().mockReturnValue('http://localhost:9000'),
	getOrThrow: jest.fn().mockReturnValue('http://localhost:9000'),
});

describe('OtpService', () => {
	let service: OtpService;
	let redisService: ReturnType<typeof createMockRedisService>;
	let emailService: ReturnType<typeof createMockEmailService>;
	let userRepository: ReturnType<typeof createMockUserRepository>;

	beforeEach(async () => {
		redisService = createMockRedisService();
		emailService = createMockEmailService();
		userRepository = createMockUserRepository();

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				OtpService,
				{ provide: RedisService, useValue: redisService },
				{ provide: EmailService, useValue: emailService },
				{ provide: ConfigService, useValue: createMockConfigService() },
				{ provide: UserRepository, useValue: userRepository },
			],
		}).compile();

		service = module.get<OtpService>(OtpService);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	// ─── sendPhoneOtp ─────────────────────────────────────────────────────────

	describe('sendPhoneOtp', () => {
		it('returns devOtp in dev mode', async () => {
			const result = await service.sendPhoneOtp('+84900000000', 'register');
			expect(result).toHaveProperty('devOtp', '000000');
		});

		it('stores OTP in redis with correct TTL for register', async () => {
			await service.sendPhoneOtp('+84900000000', 'register');
			expect(redisService.set).toHaveBeenCalledWith(
				'otp:register:+84900000000',
				'000000',
				300,
			);
		});

		it('stores OTP in redis with longer TTL for forgot', async () => {
			await service.sendPhoneOtp('+84900000000', 'forgot');
			expect(redisService.set).toHaveBeenCalledWith(
				'otp:forgot:+84900000000',
				'000000',
				900,
			);
		});

		it('throws OTP_DAILY_LIMIT_EXCEEDED when daily count exceeds 5', async () => {
			redisService.incrWithTtlOnce.mockResolvedValue(6);
			await expect(
				service.sendPhoneOtp('+84900000000', 'register'),
			).rejects.toThrow('OTP_DAILY_LIMIT_EXCEEDED');
		});

		it('throws OTP_COOLDOWN_ACTIVE when cooldown key exists', async () => {
			redisService.incrWithTtlOnce.mockResolvedValue(1);
			redisService.exists.mockResolvedValue(true);
			await expect(
				service.sendPhoneOtp('+84900000000', 'register'),
			).rejects.toThrow('OTP_COOLDOWN_ACTIVE');
		});

		it('clears email OTP keys when user has a linked email', async () => {
			const user = createUser({
				phone: '+84900000000',
				email: 'user@test.com',
			});
			userRepository.findOne.mockResolvedValue(user);

			await service.sendPhoneOtp('+84900000000', 'register');

			expect(redisService.del).toHaveBeenCalledWith(
				'otp:register:user@test.com',
			);
			expect(redisService.del).toHaveBeenCalledWith(
				'otp_attempts:register:user@test.com',
			);
		});
	});

	// ─── verifyPhoneOtp ───────────────────────────────────────────────────────

	describe('verifyPhoneOtp', () => {
		it('resolves when OTP matches', async () => {
			redisService.get.mockResolvedValue('123456');
			await expect(
				service.verifyPhoneOtp('+84900000000', '123456', 'register'),
			).resolves.toBeUndefined();
		});

		it('deletes OTP and attempt keys after successful verify', async () => {
			redisService.get.mockResolvedValue('123456');
			await service.verifyPhoneOtp('+84900000000', '123456', 'register');

			expect(redisService.del).toHaveBeenCalledWith(
				'otp:register:+84900000000',
			);
			expect(redisService.del).toHaveBeenCalledWith(
				'otp_attempts:register:+84900000000',
			);
		});

		it('throws OTP_EXPIRED_OR_NOT_FOUND when no OTP in redis', async () => {
			redisService.get.mockResolvedValue(null);
			await expect(
				service.verifyPhoneOtp('+84900000000', '123456', 'register'),
			).rejects.toThrow('OTP_EXPIRED_OR_NOT_FOUND');
		});

		it('throws OTP_INVALID when code does not match', async () => {
			redisService.get.mockResolvedValue('999999');
			await expect(
				service.verifyPhoneOtp('+84900000000', '123456', 'register'),
			).rejects.toThrow('OTP_INVALID');
		});

		it('increments attempt counter on wrong code', async () => {
			redisService.get.mockResolvedValue('999999');
			await service
				.verifyPhoneOtp('+84900000000', '123456', 'register')
				.catch(() => {});
			expect(redisService.checkAndIncrAttempt).toHaveBeenCalledWith(
				'otp_attempts:register:+84900000000',
				'otp:register:+84900000000',
				5,
			);
		});

		it('throws OTP_MAX_ATTEMPTS_EXCEEDED when attempt limit reached', async () => {
			redisService.get.mockResolvedValue('999999');
			redisService.checkAndIncrAttempt.mockResolvedValue('exceeded');
			await expect(
				service.verifyPhoneOtp('+84900000000', '123456', 'register'),
			).rejects.toThrow('OTP_MAX_ATTEMPTS_EXCEEDED');
		});
	});

	// ─── verifyEmailOtp ───────────────────────────────────────────────────────

	describe('verifyEmailOtp', () => {
		it('resolves when email OTP matches', async () => {
			redisService.get.mockResolvedValue('123456');
			await expect(
				service.verifyEmailOtp('user@test.com', '123456', 'forgot'),
			).resolves.toBeUndefined();
		});

		it('throws OTP_EXPIRED_OR_NOT_FOUND for missing email OTP', async () => {
			redisService.get.mockResolvedValue(null);
			await expect(
				service.verifyEmailOtp('user@test.com', '123456', 'forgot'),
			).rejects.toThrow('OTP_EXPIRED_OR_NOT_FOUND');
		});

		it('throws OTP_INVALID for wrong email OTP', async () => {
			redisService.get.mockResolvedValue('999999');
			await expect(
				service.verifyEmailOtp('user@test.com', '123456', 'forgot'),
			).rejects.toThrow('OTP_INVALID');
		});

		it('cleans up both OTP and attempt keys on success', async () => {
			redisService.get.mockResolvedValue('123456');
			await service.verifyEmailOtp('user@test.com', '123456', 'forgot');

			expect(redisService.del).toHaveBeenCalledWith('otp:forgot:user@test.com');
			expect(redisService.del).toHaveBeenCalledWith(
				'otp_attempts:forgot:user@test.com',
			);
		});
	});

	// ─── verifyEmailToken ─────────────────────────────────────────────────────

	describe('verifyEmailToken', () => {
		it('returns email address for valid token', async () => {
			redisService.get.mockResolvedValue('user@test.com');
			const result = await service.verifyEmailToken('some-uuid-token');
			expect(result).toBe('user@test.com');
		});

		it('deletes token from redis after verification', async () => {
			redisService.get.mockResolvedValue('user@test.com');
			await service.verifyEmailToken('some-uuid-token');
			expect(redisService.del).toHaveBeenCalledWith(
				'email_verify:some-uuid-token',
			);
		});

		it('throws EMAIL_TOKEN_EXPIRED_OR_INVALID when token not found', async () => {
			redisService.get.mockResolvedValue(null);
			await expect(service.verifyEmailToken('bad-token')).rejects.toThrow(
				'EMAIL_TOKEN_EXPIRED_OR_INVALID',
			);
		});
	});
});
