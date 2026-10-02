import { Injectable } from '@nestjs/common';
import { AdminLoginRequestDto } from './dto/requests/auth-login.request.dto';
import { UserRepository } from '@app/database/typeorm/repositories/user.repository';
import {
	HttpBadRequestError,
	HttpNotFoundError,
	HttpUnauthorizedError,
} from '@app/common/errors';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { EmailService } from '@app/services/email/email.service';
import { RedisService } from '@app/services/redis/redis.service';
import { AuthLoginResponseDto } from './dto/responses/auth-login.resonse.dto';
import { TwoFactorSetupResponseDto } from './dto/responses/two-factor-setup.response.dto';
import { ErrorCode } from '@app/common/errors';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { UserStatus } from '@app/common/enums/user-status.enum';
import { UserRole } from '@app/common/enums/user-role.enum';
import ms from 'ms';
import { AdminChangePasswordRequestDto } from './dto/requests/change-password.request.dto';
import { AdminForgotPasswordRequestDto } from './dto/requests/forgot-password,request.dto';
import { TwoFactorCodeRequestDto } from './dto/requests/two-factor-code.request.dto';
import { TwoFactorActionRequestDto } from './dto/requests/two-factor-action.request.dto';
import { TwoFactorVerifyLoginRequestDto } from './dto/requests/two-factor-verify-login.request.dto';
import { PasswordGenerator } from '@app/utils/password-generator';
import { ConfigKeys } from '@app/config/config-key.enum';
import { User } from '@app/database/typeorm/entities/identity/user.entity';
import { generateSecret, generateURI, verifySync } from 'otplib';

const ADMIN_LOGIN_MAX_ATTEMPTS = 5;
const ADMIN_LOGIN_LOCK_SECONDS = 15 * 60;

@Injectable()
export class AdminAuthService {
	constructor(
		private readonly userRepository: UserRepository,
		private readonly configService: ConfigService,
		private readonly jwtService: JwtService,
		private readonly emailService: EmailService,
		private readonly redisService: RedisService,
	) {}
	async login(body: AdminLoginRequestDto): Promise<AuthLoginResponseDto> {
		const { email, password } = body;
		const lockKey = `admin_login_lock:${email}`;
		const attemptsKey = `admin_login_attempts:${email}`;

		if (await this.redisService.exists(lockKey)) {
			throw new HttpBadRequestError(ErrorCode.LOGIN_ACCOUNT_LOCKED);
		}

		const user = await this.userRepository.findOne({ email });
		const isValidPassword = user?.passwordHash
			? await bcrypt.compare(password, user.passwordHash)
			: false;

		if (
			!user ||
			!user.email ||
			user.role !== UserRole.ADMIN ||
			!isValidPassword
		) {
			await this.incrementAdminLoginAttempt(attemptsKey, lockKey);
			throw new HttpBadRequestError(ErrorCode.INCORRECT_EMAIL_PASSWORD);
		}

		if (user.status !== UserStatus.ACTIVE) {
			throw new HttpBadRequestError(ErrorCode.INCORRECT_EMAIL_PASSWORD);
		}

		await this.redisService.del(attemptsKey);

		if (user.twoFactorEnabled) {
			const jti = crypto.randomUUID();
			const tempToken = await this.jwtService.signAsync(
				{ id: user.id, purpose: '2fa', jti },
				{
					secret: this.configService.getOrThrow(ConfigKeys.JWT_SECRET),
					expiresIn: '5m',
				},
			);
			return { requiresTwoFactor: true, tempToken };
		}

		const tokenData = await this.generateToken({
			id: user.id,
			role: user.role,
			phone: user.phone || '',
			email: user.email,
			status: user.status,
			version: user.version,
		});
		return {
			accessToken: tokenData.accessToken,
			expiredIn: tokenData.expiredIn,
			profile: user as any,
		};
	}

	private async generateToken(data: {
		id: string;
		role: UserRole;
		phone?: string;
		email?: string;
		status: UserStatus;
		version: number;
	}): Promise<{ accessToken: string; expiredIn: number }> {
		const accessTokenExpiresIn = this.configService.getOrThrow(
			ConfigKeys.JWT_EXPIRES,
		);
		const secret = this.configService.getOrThrow(ConfigKeys.JWT_SECRET);
		const tokenExpires = ms(accessTokenExpiresIn as ms.StringValue);

		const accessToken = await this.jwtService.signAsync(
			{
				id: data.id,
				role: data.role,
				email: data.email,
				phone: data.phone,
				status: data.status,
				v: data.version,
			},
			{
				secret,
				expiresIn: accessTokenExpiresIn,
			},
		);

		return {
			accessToken,
			expiredIn: tokenExpires,
		};
	}

	async changePassword(userId: string, input: AdminChangePasswordRequestDto) {
		const user = await this.userRepository.findById(userId);
		if (!user) {
			throw new HttpNotFoundError(ErrorCode.USER_NOT_FOUND);
		}

		const isValidPassword = await bcrypt.compare(
			input.oldPassword,
			user.passwordHash!,
		);
		if (!isValidPassword) {
			throw new HttpBadRequestError(ErrorCode.INCORRECT_CURRENT_PASSWORD);
		}

		const hashedNewPassword = await bcrypt.hash(input.newPassword, 10);

		await this.userRepository.executeInTransaction(async (manager) => {
			await manager
				.createQueryBuilder()
				.update(User)
				.set({ passwordHash: hashedNewPassword, version: () => 'version + 1' })
				.where('id = :id', { id: userId })
				.execute();
		});

		return null;
	}

	async forgotPassword(input: AdminForgotPasswordRequestDto) {
		const user = await this.userRepository.findOne({
			email: input.email,
			role: UserRole.ADMIN,
		});
		if (!user || user.status !== UserStatus.ACTIVE) {
			return {
				message:
					'If the email exists, a new password will be sent to your inbox',
			};
		}

		const password = PasswordGenerator.generateStrong();
		const hashedPassword = await bcrypt.hash(password, 10);

		const safePassword = password
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;');

		// Send email before updating DB — if delivery fails, the password is not replaced
		await this.emailService.sendMail({
			to: user.email!,
			subject: 'Forgot Password',
			html: `<p>Your new temporary password is: <strong>${safePassword}</strong></p><p>Please change it immediately after logging in.</p>`,
		});

		await this.userRepository.executeInTransaction(async (manager) => {
			await manager
				.createQueryBuilder()
				.update(User)
				.set({ passwordHash: hashedPassword, version: () => 'version + 1' })
				.where('id = :id', { id: user.id })
				.execute();
		});

		return {
			message: 'New password has been sent to your email',
		};
	}

	async setup2FA(userId: string): Promise<TwoFactorSetupResponseDto> {
		const user = await this.userRepository.findById(userId);
		if (!user) throw new HttpNotFoundError(ErrorCode.USER_NOT_FOUND);
		if (user.twoFactorEnabled) {
			throw new HttpBadRequestError(ErrorCode.TWO_FACTOR_ALREADY_ENABLED);
		}
		// Prevent silently overwriting a secret that was already set up but not yet confirmed
		if (user.twoFactorSecret) {
			throw new HttpBadRequestError(
				ErrorCode.TWO_FACTOR_SETUP_ALREADY_IN_PROGRESS,
			);
		}

		const secret = generateSecret();
		const otpauthUrl = generateURI({
			label: user.email ?? user.username,
			secret,
			issuer: 'VietGreenX Admin',
		});

		await this.userRepository.executeInTransaction(async (manager) => {
			await manager
				.createQueryBuilder()
				.update(User)
				.set({ twoFactorSecret: secret })
				.where('id = :id', { id: userId })
				.execute();
		});

		return { secret, otpauthUrl };
	}

	async resetSetup2FA(userId: string): Promise<null> {
		const user = await this.userRepository.findById(userId);
		if (!user) throw new HttpNotFoundError(ErrorCode.USER_NOT_FOUND);
		if (user.twoFactorEnabled) {
			throw new HttpBadRequestError(ErrorCode.TWO_FACTOR_ALREADY_ENABLED);
		}

		await this.userRepository.executeInTransaction(async (manager) => {
			await manager
				.createQueryBuilder()
				.update(User)
				.set({ twoFactorSecret: null })
				.where('id = :id', { id: userId })
				.execute();
		});

		return null;
	}

	async enable2FA(
		userId: string,
		dto: TwoFactorCodeRequestDto,
	): Promise<{ backupCodes: string[] }> {
		const user = await this.userRepository.findById(userId);
		if (!user) throw new HttpNotFoundError(ErrorCode.USER_NOT_FOUND);
		if (user.twoFactorEnabled) {
			throw new HttpBadRequestError(ErrorCode.TWO_FACTOR_ALREADY_ENABLED);
		}
		if (!user.twoFactorSecret) {
			throw new HttpBadRequestError(ErrorCode.TWO_FACTOR_NOT_SETUP);
		}

		const isValid = verifySync({
			token: dto.code,
			secret: user.twoFactorSecret,
			epochTolerance: 30,
		});
		if (!isValid.valid)
			throw new HttpBadRequestError(ErrorCode.TWO_FACTOR_INVALID_CODE);

		const { plain, hashed } = await this.generateBackupCodes();

		await this.userRepository.executeInTransaction(async (manager) => {
			await manager
				.createQueryBuilder()
				.update(User)
				.set({ twoFactorEnabled: true, twoFactorBackupCodes: hashed })
				.where('id = :id', { id: userId })
				.execute();
		});

		return { backupCodes: plain };
	}

	async disable2FA(
		userId: string,
		dto: TwoFactorActionRequestDto,
	): Promise<null> {
		const user = await this.userRepository.findById(userId);
		if (!user) throw new HttpNotFoundError(ErrorCode.USER_NOT_FOUND);
		if (!user.twoFactorEnabled) {
			throw new HttpBadRequestError(ErrorCode.TWO_FACTOR_NOT_ENABLED);
		}

		await this.verifyTotpOrBackupCode(user, dto);

		await this.userRepository.executeInTransaction(async (manager) => {
			await manager
				.createQueryBuilder()
				.update(User)
				.set({
					twoFactorEnabled: false,
					twoFactorSecret: null,
					twoFactorBackupCodes: null,
					version: () => 'version + 1',
				})
				.where('id = :id', { id: userId })
				.execute();
		});

		return null;
	}

	async regenerateBackupCodes(
		userId: string,
		dto: TwoFactorActionRequestDto,
	): Promise<{ backupCodes: string[] }> {
		const user = await this.userRepository.findById(userId);
		if (!user) throw new HttpNotFoundError(ErrorCode.USER_NOT_FOUND);
		if (!user.twoFactorEnabled) {
			throw new HttpBadRequestError(ErrorCode.TWO_FACTOR_NOT_ENABLED);
		}

		await this.verifyTotpOrBackupCode(user, dto);

		const { plain, hashed } = await this.generateBackupCodes();

		await this.userRepository.executeInTransaction(async (manager) => {
			await manager
				.createQueryBuilder()
				.update(User)
				.set({ twoFactorBackupCodes: hashed, version: () => 'version + 1' })
				.where('id = :id', { id: userId })
				.execute();
		});

		return { backupCodes: plain };
	}

	private async verifyTotpOrBackupCode(
		user: User,
		dto: TwoFactorActionRequestDto,
	): Promise<void> {
		if (dto.code) {
			if (!user.twoFactorSecret)
				throw new HttpBadRequestError(ErrorCode.TWO_FACTOR_NOT_SETUP);
			const isValid = verifySync({
				token: dto.code,
				secret: user.twoFactorSecret,
				epochTolerance: 30,
			});
			if (!isValid.valid)
				throw new HttpBadRequestError(ErrorCode.TWO_FACTOR_INVALID_CODE);
		} else if (dto.backupCode) {
			const matched = await this.findAndConsumeBackupCode(user, dto.backupCode);
			if (!matched)
				throw new HttpBadRequestError(ErrorCode.TWO_FACTOR_INVALID_BACKUP_CODE);
		} else {
			throw new HttpBadRequestError(ErrorCode.TWO_FACTOR_INVALID_CODE);
		}
	}

	async verifyTwoFactorLogin(
		dto: TwoFactorVerifyLoginRequestDto,
	): Promise<AuthLoginResponseDto> {
		let payload: { id: string; purpose: string; jti: string };
		try {
			payload = await this.jwtService.verifyAsync(dto.tempToken, {
				secret: this.configService.getOrThrow(ConfigKeys.JWT_SECRET),
			});
		} catch {
			throw new HttpUnauthorizedError(ErrorCode.TWO_FACTOR_INVALID_TEMP_TOKEN);
		}

		if (payload.purpose !== '2fa' || !payload.jti) {
			throw new HttpUnauthorizedError(ErrorCode.TWO_FACTOR_INVALID_TEMP_TOKEN);
		}

		// Atomic claim: SET NX ensures only one request can consume this jti
		const blacklistKey = `2fa_temp_used:${payload.jti}`;
		const claimed = await this.redisService.setNx(blacklistKey, '1', 5 * 60);
		if (!claimed) {
			throw new HttpUnauthorizedError(ErrorCode.TWO_FACTOR_INVALID_TEMP_TOKEN);
		}

		const user = await this.userRepository.findById(payload.id);
		if (!user || !user.twoFactorEnabled || user.status !== UserStatus.ACTIVE) {
			// Release the claim so the user can retry with a valid state
			await this.redisService.del(blacklistKey);
			throw new HttpUnauthorizedError(ErrorCode.TWO_FACTOR_INVALID_TEMP_TOKEN);
		}

		try {
			if (dto.code) {
				if (!user.twoFactorSecret)
					throw new HttpBadRequestError(ErrorCode.TWO_FACTOR_NOT_SETUP);
				const isValid = verifySync({
					token: dto.code,
					secret: user.twoFactorSecret,
					epochTolerance: 30,
				});
				if (!isValid.valid)
					throw new HttpBadRequestError(ErrorCode.TWO_FACTOR_INVALID_CODE);
			} else if (dto.backupCode) {
				const matched = await this.findAndConsumeBackupCode(
					user,
					dto.backupCode,
				);
				if (!matched) {
					throw new HttpBadRequestError(
						ErrorCode.TWO_FACTOR_INVALID_BACKUP_CODE,
					);
				}
			} else {
				throw new HttpBadRequestError(ErrorCode.TWO_FACTOR_INVALID_CODE);
			}

			const tokenData = await this.generateToken({
				id: user.id,
				role: user.role,
				phone: user.phone || '',
				email: user.email!,
				status: user.status,
				version: user.version,
			});

			return {
				accessToken: tokenData.accessToken,
				expiredIn: tokenData.expiredIn,
				profile: user as any,
			};
		} catch (err) {
			// Release the claim so the user can retry
			await this.redisService.del(blacklistKey);
			throw err;
		}
	}

	private async generateBackupCodes(): Promise<{
		plain: string[];
		hashed: string[];
	}> {
		const plain = Array.from({ length: 10 }, () =>
			crypto.randomBytes(4).toString('hex'),
		);
		const hashed = await Promise.all(
			plain.map((code) => bcrypt.hash(code, 10)),
		);
		return { plain, hashed };
	}

	private async findAndConsumeBackupCode(
		user: User,
		inputCode: string,
	): Promise<boolean> {
		return this.userRepository.executeInTransaction(async (manager) => {
			// Pessimistic write lock: prevents two concurrent requests from consuming the same code
			const lockedUser = await manager.findOne(User, {
				where: { id: user.id },
				lock: { mode: 'pessimistic_write' },
			});

			const codes = lockedUser?.twoFactorBackupCodes ?? [];
			let matchIndex = -1;

			for (let i = 0; i < codes.length; i++) {
				if (await bcrypt.compare(inputCode, codes[i])) {
					matchIndex = i;
					break;
				}
			}

			if (matchIndex === -1) return false;

			await manager
				.createQueryBuilder()
				.update(User)
				.set({ twoFactorBackupCodes: codes.filter((_, i) => i !== matchIndex) })
				.where('id = :id', { id: user.id })
				.execute();

			return true;
		});
	}

	private async incrementAdminLoginAttempt(
		attemptsKey: string,
		lockKey: string,
	): Promise<void> {
		// Atomic INCR + conditional EXPIRE via Lua — prevents TTL loss under concurrent failures.
		const count = await this.redisService.incrWithTtlOnce(
			attemptsKey,
			ADMIN_LOGIN_LOCK_SECONDS,
		);
		if (count >= ADMIN_LOGIN_MAX_ATTEMPTS) {
			await this.redisService.set(lockKey, '1', ADMIN_LOGIN_LOCK_SECONDS);
			await this.redisService.del(attemptsKey);
		}
	}
}
