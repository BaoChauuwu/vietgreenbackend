import { Injectable, Logger } from '@nestjs/common';
import { HttpBadRequestError } from '@app/common/errors/bad-request.error';
import { HttpConflictError } from '@app/common/errors/conflict.error';
import { HttpNotFoundError } from '@app/common/errors/not-found.error';
import { HttpUnauthorizedError } from '@app/common/errors/unauthorized.error';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import ms from 'ms';

import { UserRepository } from '@app/database/typeorm/repositories/user.repository';
import { UserSessionRepository } from '@app/database/typeorm/repositories/user-session.repository';
import { FcmDeviceRepository } from '@app/database/typeorm/repositories/fcm-device.repository';
import { RedisService } from '@app/services/redis/redis.service';
import { OtpService } from '@app/services/otp/otp.service';
import { StatsService } from '@app/modules/app/stats/stats.service';
import { ConfigKeys } from '@app/config/config-key.enum';
import { UserRole } from '@app/common/enums/user-role.enum';
import { REGISTERABLE_USER_ROLES } from '@app/common/constants/registerable-user-roles';
import { SignupChannel } from '@app/common/enums/signup-channel.enum';
import { UserStatus } from '@app/common/enums/user-status.enum';
import { VerificationLevel } from '@app/common/enums/verification-level.enum';
import { User } from '@app/database/typeorm/entities/identity/user.entity';
import { Profile } from '@app/database/typeorm/entities/identity/profile.entity';
import { UserSession } from '@app/database/typeorm/entities/identity/user-session.entity';
import { ErrorCode } from '@app/common/errors/error-code';
import {
	isVietnamesePhone,
	normalizeVietnamesePhone,
} from '@app/common/utils/normalize-vietnamese-phone';

import { RegisterPhoneRequestDto } from './dto/requests/register-phone.request.dto';
import { VerifyPhoneOtpRequestDto } from './dto/requests/verify-phone-otp.request.dto';
import { RegisterEmailRequestDto } from './dto/requests/register-email.request.dto';
import { VerifyEmailTokenRequestDto } from './dto/requests/verify-email-token.request.dto';
import { LoginRequestDto } from './dto/requests/login.request.dto';
import { RefreshTokenRequestDto } from './dto/requests/refresh-token.request.dto';
import { ForgotPasswordRequestDto } from './dto/requests/forgot-password.request.dto';
import { ResetPasswordRequestDto } from './dto/requests/reset-password.request.dto';
import { LogoutRequestDto } from './dto/requests/logout.request.dto';
import { AuthTokenResponseDto } from './dto/responses/auth-token.response.dto';
import { SessionResponseDto } from './dto/responses/session.response.dto';
import { CheckUsernameResponseDto } from './dto/responses/check-username.response.dto';
import { CheckPhoneOtpRequestDto } from './dto/requests/check-phone-otp.request.dto';

// Cost factor 10: ~100ms on modern hardware. Adjust via BCRYPT_ROUNDS env if latency becomes a concern.
const BCRYPT_ROUNDS = 10;
const REFRESH_TOKEN_EXPIRES = '30d';
const LOGIN_MAX_ATTEMPTS = 5;
const LOGIN_LOCK_SECONDS = 15 * 60;
const PASSWORD_HISTORY_COUNT = 3;
const USERNAME_GEN_MAX_RETRIES = 10;

@Injectable()
export class AppAuthService {
	private readonly logger = new Logger(AppAuthService.name);

	constructor(
		private readonly userRepository: UserRepository,
		private readonly userSessionRepository: UserSessionRepository,
		private readonly fcmDeviceRepository: FcmDeviceRepository,
		private readonly redisService: RedisService,
		private readonly otpService: OtpService,
		private readonly statsService: StatsService,
		private readonly jwtService: JwtService,
		private readonly configService: ConfigService,
		@InjectEntityManager() private readonly entityManager: EntityManager,
	) {}

	// ─── TASK 1: Phone Registration ──────────────────────────────────────────────

	async registerPhone(
		dto: RegisterPhoneRequestDto,
	): Promise<{ devOtp?: string } | null> {
		const phone = normalizeVietnamesePhone(dto.phone);
		const existing = await this.entityManager.findOne(User, {
			where: { phone },
			withDeleted: true,
		});
		if (existing) throw new HttpConflictError(ErrorCode.PHONE_ALREADY_EXISTS);

		const result = await this.otpService
			.sendPhoneOtp(phone, 'register')
			.catch((err) => {
				throw new HttpBadRequestError(this.mapOtpError(err.message));
			});
		return result.devOtp ? { devOtp: result.devOtp } : null;
	}

	async checkRegisterPhoneOtp(
		dto: CheckPhoneOtpRequestDto,
	): Promise<{ valid: boolean }> {
		const phone = normalizeVietnamesePhone(dto.phone);
		await this.otpService
			.checkPhoneOtp(phone, dto.otp, 'register')
			.catch((err) => {
				throw new HttpBadRequestError(this.mapOtpError(err.message));
			});
		return { valid: true };
	}

	async verifyPhoneOtp(
		dto: VerifyPhoneOtpRequestDto,
		ipAddress?: string,
		userAgent?: string,
	): Promise<AuthTokenResponseDto> {
		const phone = normalizeVietnamesePhone(dto.phone);
		await this.otpService
			.verifyPhoneOtp(phone, dto.otp, 'register')
			.catch((err) => {
				throw new HttpBadRequestError(this.mapOtpError(err.message));
			});

		const { savedUserId, savedUserRole } = await this.entityManager.transaction(
			async (manager) => {
				const existed = await manager.findOne(User, {
					where: { phone },
					withDeleted: true,
				});
				if (existed)
					throw new HttpConflictError(ErrorCode.PHONE_ALREADY_EXISTS);

				const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
				const username = await this.generateUsername(phone, manager);

				const user = manager.create(User, {
					phone,
					username,
					passwordHash,
					role: this.resolveRegistrationRole(dto.role),
					status: UserStatus.ACTIVE,
					verificationLevel: VerificationLevel.UNVERIFIED,
					phoneVerified: true,
					authProvider: 'local',
					signupChannel: SignupChannel.PHONE,
				});
				const savedUser = await manager.save(user);

				// trg_auto_create_profile trigger already inserted the profile row
				// (display_name = username). Update it with the user-supplied display name.
				await manager.update(
					Profile,
					{ userId: savedUser.id },
					{ displayName: dto.displayName },
				);

				return { savedUserId: savedUser.id, savedUserRole: savedUser.role };
			},
		);

		void this.statsService.invalidatePublicStatsCache();
		return this.issueTokens(savedUserId, savedUserRole, ipAddress, userAgent);
	}

	// ─── TASK 2: Email Registration ──────────────────────────────────────────────

	async registerEmail(
		dto: RegisterEmailRequestDto,
	): Promise<{ devOtp?: string } | null> {
		const existing = await this.userRepository.findOne({ email: dto.email });
		if (existing) throw new HttpConflictError(ErrorCode.EMAIL_EXISTS);

		const token = crypto.randomUUID();
		const frontendUrl =
			this.configService.get<string>(ConfigKeys.FRONTEND_DOMAIN) ??
			'http://localhost:3000';

		await this.otpService.sendEmailVerificationToken(
			dto.email,
			token,
			frontendUrl,
		);
		return null;
	}

	async verifyEmailToken(
		dto: VerifyEmailTokenRequestDto,
		ipAddress?: string,
		userAgent?: string,
	): Promise<AuthTokenResponseDto> {
		const email = await this.otpService
			.verifyEmailToken(dto.token)
			.catch(() => {
				throw new HttpBadRequestError(
					ErrorCode.EMAIL_VERIFICATION_LINK_INVALID,
				);
			});

		const { savedUserId, savedUserRole } = await this.entityManager.transaction(
			async (manager) => {
				const existed = await manager.findOne(User, { where: { email } });
				if (existed) throw new HttpConflictError(ErrorCode.EMAIL_EXISTS);

				const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
				const username = await this.generateUsername(
					email.split('@')[0],
					manager,
				);

				const user = manager.create(User, {
					email,
					username,
					passwordHash,
					role: this.resolveRegistrationRole(dto.role),
					status: UserStatus.ACTIVE,
					verificationLevel: VerificationLevel.UNVERIFIED,
					emailVerified: true,
					authProvider: 'local',
					signupChannel: SignupChannel.EMAIL,
				});
				const savedUser = await manager.save(user);

				// trg_auto_create_profile trigger already inserted the profile row
				// (display_name = username). Update it with the user-supplied display name.
				await manager.update(
					Profile,
					{ userId: savedUser.id },
					{ displayName: dto.displayName },
				);

				return { savedUserId: savedUser.id, savedUserRole: savedUser.role };
			},
		);

		void this.statsService.invalidatePublicStatsCache();
		return this.issueTokens(savedUserId, savedUserRole, ipAddress, userAgent);
	}

	// ─── TASK 4: Login ───────────────────────────────────────────────────────────

	async login(
		dto: LoginRequestDto,
		ipAddress?: string,
		userAgent?: string,
	): Promise<AuthTokenResponseDto> {
		const identifier = isVietnamesePhone(dto.identifier)
			? normalizeVietnamesePhone(dto.identifier)
			: dto.identifier;

		if (await this.redisService.exists(`login_lock:${identifier}`)) {
			throw new HttpBadRequestError(ErrorCode.LOGIN_ACCOUNT_LOCKED);
		}

		const user = isVietnamesePhone(identifier)
			? await this.userRepository.findOne({ phone: identifier })
			: await this.userRepository.findOne({ email: identifier });

		if (!user || !user.passwordHash) {
			await this.incrementLoginAttempt(identifier);
			throw new HttpBadRequestError(ErrorCode.INCORRECT_LOGIN_INFO);
		}

		const isValid = await bcrypt.compare(dto.password, user.passwordHash);
		if (!isValid) {
			await this.incrementLoginAttempt(identifier);
			throw new HttpBadRequestError(ErrorCode.INCORRECT_LOGIN_INFO);
		}

		if (user.status !== UserStatus.ACTIVE) {
			await this.incrementLoginAttempt(identifier);
			throw new HttpBadRequestError(ErrorCode.INCORRECT_LOGIN_INFO);
		}

		await this.redisService.del(`login_attempts:${identifier}`);

		void this.userRepository
			.update({ id: user.id }, { lastLoginAt: new Date() })
			.catch((err) => this.logger.warn('Failed to update lastLoginAt', err));
		if (dto.fcmToken) {
			void this.upsertFcmDevice(
				user.id,
				dto.fcmToken,
				dto.platform,
				dto.deviceId,
			);
		}

		return this.issueTokens(
			user.id,
			user.role,
			ipAddress,
			userAgent,
			user.version,
			{
				platform: dto.platform,
				deviceName: dto.deviceName,
				deviceId: dto.deviceId,
			},
		);
	}

	async refreshToken(
		dto: RefreshTokenRequestDto,
		ipAddress?: string,
	): Promise<AuthTokenResponseDto> {
		const tokenHash = this.hashToken(dto.refreshToken);

		const user = await this.userSessionRepository.executeInTransaction(
			async (manager) => {
				const session = await manager
					.getRepository(UserSession)
					.createQueryBuilder('session')
					.setLock('pessimistic_write')
					.where('session.tokenHash = :tokenHash', { tokenHash })
					.getOne();

				if (!session) throw new HttpUnauthorizedError(ErrorCode.UNAUTHORIZED);
				if (session.revokedAt) {
					throw new HttpUnauthorizedError(ErrorCode.UNAUTHORIZED);
				}
				if (session.expiresAt < new Date()) {
					throw new HttpUnauthorizedError(ErrorCode.UNAUTHORIZED);
				}

				const activeUser = await manager.findOne(User, {
					where: { id: session.userId },
				});
				if (!activeUser || activeUser.status !== UserStatus.ACTIVE) {
					throw new HttpUnauthorizedError(ErrorCode.USER_IN_ACTIVE);
				}

				session.revokedAt = new Date();
				session.lastUsedAt = new Date();
				await manager.save(UserSession, session);

				return activeUser;
			},
		);

		return this.issueTokens(
			user.id,
			user.role,
			ipAddress,
			undefined,
			user.version,
		);
	}

	// ─── TASK 7: Logout & Sessions ───────────────────────────────────────────────

	async logout(dto: LogoutRequestDto): Promise<null> {
		const tokenHash = this.hashToken(dto.refreshToken);
		const session = await this.userSessionRepository.findOne({ tokenHash });
		if (session && !session.revokedAt) {
			await this.userSessionRepository.update(
				{ id: session.id },
				{
					revokedAt: new Date(),
				},
			);
		}
		return null;
	}

	async getSessions(
		userId: string,
		currentRefreshToken?: string,
	): Promise<SessionResponseDto[]> {
		const now = new Date();
		const sessions = await this.userSessionRepository.findAll({
			where: { userId },
			order: { createdAt: 'DESC' },
		});

		const currentHash = currentRefreshToken
			? this.hashToken(currentRefreshToken)
			: null;

		return sessions
			.filter((s) => !s.revokedAt && s.expiresAt > now)
			.map(
				(s): SessionResponseDto => ({
					id: s.id,
					deviceName: s.deviceName,
					platform: s.platform,
					ipAddress: s.ipAddress,
					lastUsedAt: s.lastUsedAt,
					createdAt: s.createdAt,
					isCurrent: currentHash !== null && s.tokenHash === currentHash,
				}),
			);
	}

	async revokeSession(sessionId: string, userId: string): Promise<null> {
		const session = await this.userSessionRepository.findById(sessionId);
		if (!session || session.userId !== userId) {
			throw new HttpNotFoundError(ErrorCode.SESSION_NOT_FOUND);
		}
		await this.userSessionRepository.update(
			{ id: sessionId },
			{
				revokedAt: new Date(),
			},
		);
		return null;
	}

	async revokeAllSessions(
		userId: string,
		options?: { bumpVersion?: boolean },
	): Promise<null> {
		if (options?.bumpVersion ?? true) {
			await this.userRepository.executeInTransaction(async (manager) => {
				await manager
					.createQueryBuilder()
					.update(User)
					.set({ version: () => 'version + 1' })
					.where('id = :id', { id: userId })
					.execute();
			});
		}

		await this.userSessionRepository.bulkUpdate(
			{ userId },
			{ revokedAt: new Date() },
		);
		return null;
	}

	// ─── TASK 5: Forgot / Reset Password ─────────────────────────────────────────

	async forgotPassword(
		dto: ForgotPasswordRequestDto,
	): Promise<{ devOtp?: string } | null> {
		if (!dto.phone && !dto.email) {
			throw new HttpBadRequestError(ErrorCode.PHONE_OR_EMAIL_REQUIRED);
		}

		if (dto.phone) {
			const phone = normalizeVietnamesePhone(dto.phone);
			const user = await this.userRepository.findOne({ phone });
			if (!user) return null;
			const result = await this.otpService
				.sendPhoneOtp(phone, 'forgot')
				.catch((err) => {
					throw new HttpBadRequestError(this.mapOtpError(err.message));
				});
			return result.devOtp ? { devOtp: result.devOtp } : null;
		}

		const user = await this.userRepository.findOne({ email: dto.email });
		if (!user) return null;
		const result = await this.otpService
			.sendEmailOtp(dto.email!, 'forgot')
			.catch((err) => {
				throw new HttpBadRequestError(this.mapOtpError(err.message));
			});
		return result.devOtp ? { devOtp: result.devOtp } : null;
	}

	async resetPassword(dto: ResetPasswordRequestDto): Promise<null> {
		if (!dto.phone && !dto.email) {
			throw new HttpBadRequestError(ErrorCode.PHONE_OR_EMAIL_REQUIRED);
		}

		let userId: string;
		let user: User | null;

		if (dto.phone) {
			const phone = normalizeVietnamesePhone(dto.phone);
			await this.otpService
				.verifyPhoneOtp(phone, dto.otp, 'forgot')
				.catch((err) => {
					throw new HttpBadRequestError(this.mapOtpError(err.message));
				});
			user = await this.userRepository.findOne({ phone });
			if (!user) throw new HttpNotFoundError(ErrorCode.USER_NOT_FOUND);
			userId = user.id;
		} else {
			await this.otpService
				.verifyEmailOtp(dto.email!, dto.otp, 'forgot')
				.catch((err) => {
					throw new HttpBadRequestError(this.mapOtpError(err.message));
				});
			user = await this.userRepository.findOne({ email: dto.email });
			if (!user) throw new HttpNotFoundError(ErrorCode.USER_NOT_FOUND);
			userId = user.id;
		}

		if (
			user.passwordHash &&
			(await bcrypt.compare(dto.newPassword, user.passwordHash))
		) {
			throw new HttpBadRequestError(ErrorCode.NEW_PASSWORD_SAME_AS_CURRENT);
		}

		await this.checkPasswordHistory(userId, dto.newPassword);
		const newHash = await bcrypt.hash(dto.newPassword, BCRYPT_ROUNDS);
		await this.userRepository.executeInTransaction(async (manager) => {
			await manager
				.createQueryBuilder()
				.update(User)
				.set({ passwordHash: newHash, version: () => 'version + 1' })
				.where('id = :id', { id: userId })
				.execute();
		});
		await this.savePasswordHistory(userId, newHash);
		await this.revokeAllSessions(userId, { bumpVersion: false });

		return null;
	}

	// ─── Private helpers ─────────────────────────────────────────────────────────

	private async issueTokens(
		userId: string,
		role: UserRole,
		ipAddress?: string,
		userAgent?: string,
		version: number = 0,
		device?: { platform?: string; deviceName?: string; deviceId?: string },
	): Promise<AuthTokenResponseDto> {
		const secret = this.configService.getOrThrow<string>(ConfigKeys.JWT_SECRET);
		const accessExpires =
			this.configService.get<string>(ConfigKeys.JWT_EXPIRES) ?? '15m';
		const accessTtlMs = ms(accessExpires as ms.StringValue);
		const refreshTtlMs = ms(REFRESH_TOKEN_EXPIRES as ms.StringValue);

		const accessToken = await this.jwtService.signAsync(
			{ sub: userId, role, v: version },
			{ secret, expiresIn: accessExpires as ms.StringValue },
		);

		const rawRefreshToken =
			crypto.randomUUID() + '.' + crypto.randomBytes(32).toString('hex');
		const tokenHash = this.hashToken(rawRefreshToken);
		const expiresAt = new Date(Date.now() + refreshTtlMs);

		await this.userSessionRepository.create({
			userId,
			tokenHash,
			expiresAt,
			ipAddress: ipAddress ?? null,
			userAgent: userAgent ?? null,
			platform: device?.platform ?? null,
			deviceName: device?.deviceName ?? null,
			deviceId: device?.deviceId ?? null,
			lastUsedAt: new Date(),
		});

		return {
			accessToken,
			accessTokenExpires: accessTtlMs,
			refreshToken: rawRefreshToken,
			refreshTokenExpires: refreshTtlMs,
			role,
			userId,
		};
	}

	private hashToken(token: string): string {
		return crypto.createHash('sha256').update(token).digest('hex');
	}

	private async incrementLoginAttempt(identifier: string): Promise<void> {
		const key = `login_attempts:${identifier}`;
		const count = await this.redisService.incr(key);
		if (count === 1) await this.redisService.expire(key, LOGIN_LOCK_SECONDS);
		if (count >= LOGIN_MAX_ATTEMPTS) {
			await this.redisService.set(
				`login_lock:${identifier}`,
				'1',
				LOGIN_LOCK_SECONDS,
			);
			await this.redisService.del(key);
		}
	}

	private async generateUsername(
		base: string,
		manager?: EntityManager,
	): Promise<string> {
		const clean =
			base
				.toLowerCase()
				.replace(/[^a-z0-9]/g, '')
				.slice(0, 20) || 'user';

		const repo = manager ?? this.entityManager;
		let candidate = clean;

		for (let i = 1; i <= USERNAME_GEN_MAX_RETRIES; i++) {
			const exists = await repo.findOne(User, {
				where: { username: candidate },
			});
			if (!exists) return candidate;
			candidate = `${clean}${i}`;
		}

		return `${clean}${crypto.randomBytes(3).toString('hex')}`;
	}

	private async upsertFcmDevice(
		userId: string,
		fcmToken: string,
		platform?: string,
		deviceId?: string,
	): Promise<void> {
		try {
			await this.fcmDeviceRepository.upsert(
				[
					{
						userId,
						fcmToken,
						platform: platform ?? 'unknown',
						deviceId: deviceId ?? null,
						isActive: true,
					},
				],
				['fcmToken'],
			);
		} catch (err) {
			this.logger.warn('FCM device upsert failed', err);
		}
	}

	async checkPasswordHistory(
		userId: string,
		newPassword: string,
	): Promise<void> {
		const raw = await this.redisService.get(`pwd_history:${userId}`);
		if (!raw) return;

		const hashes: string[] = JSON.parse(raw);
		for (const hash of hashes) {
			if (await bcrypt.compare(newPassword, hash)) {
				throw new HttpBadRequestError(ErrorCode.PASSWORD_REUSE_NOT_ALLOWED);
			}
		}
	}

	async savePasswordHistory(userId: string, newHash: string): Promise<void> {
		const key = `pwd_history:${userId}`;
		const raw = await this.redisService.get(key);
		const hashes: string[] = raw ? JSON.parse(raw) : [];
		hashes.unshift(newHash);
		await this.redisService.set(
			key,
			JSON.stringify(hashes.slice(0, PASSWORD_HISTORY_COUNT)),
			365 * 24 * 3600,
		);
	}

	private mapOtpError(code: string): ErrorCode {
		const map: Record<string, ErrorCode> = {
			OTP_INVALID: ErrorCode.INVALID_OTP,
			OTP_EXPIRED_OR_NOT_FOUND: ErrorCode.OTP_EXPIRED_OR_NOT_FOUND,
			OTP_MAX_ATTEMPTS_EXCEEDED: ErrorCode.OTP_MAX_ATTEMPTS_EXCEEDED,
			OTP_DAILY_LIMIT_EXCEEDED: ErrorCode.OTP_DAILY_LIMIT_EXCEEDED,
			OTP_COOLDOWN_ACTIVE: ErrorCode.OTP_COOLDOWN_ACTIVE,
			EMAIL_TOKEN_EXPIRED_OR_INVALID: ErrorCode.EMAIL_VERIFICATION_LINK_INVALID,
		};
		return map[code] ?? ErrorCode.INTERNAL_SERVER_ERROR;
	}
	private resolveRegistrationRole(role?: UserRole): UserRole {
		if (!role) {
			return UserRole.CONSUMER;
		}
		if (!(REGISTERABLE_USER_ROLES as readonly UserRole[]).includes(role)) {
			throw new HttpBadRequestError(ErrorCode.NOT_PERMITTED_ROLE);
		}
		return role;
	}

	async checkUsernameAvailability(
		username: string,
	): Promise<CheckUsernameResponseDto> {
		const isTaken = await this.userRepository.exists({ username });
		return { available: !isTaken };
	}
}
