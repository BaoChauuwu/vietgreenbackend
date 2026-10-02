import * as crypto from 'crypto';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '@app/services/redis/redis.service';
import { EmailService } from '@app/services/email/email.service';
import { generateEmailVerification } from '@app/services/email/email-templates/email-verification';
import { ConfigKeys } from '@app/config/config-key.enum';
import {
	generateForgotOtpTemplate,
	generateChangePasswordOtpTemplate,
	generateChangeEmailOtpTemplate,
} from '../email/email-templates/otp.template';
import { UserRepository } from '@app/database/typeorm/repositories/user.repository';

const OTP_TTL_SECONDS = 5 * 60;
const OTP_FORGOT_TTL_SECONDS = 15 * 60;
const OTP_CHANGE_PWD_TTL_SECONDS = 15 * 60;
const OTP_CHANGE_EMAIL_TTL_SECONDS = 15 * 60;
const OTP_RESEND_COOLDOWN = 5;
const OTP_MAX_SENDS_PER_DAY = 100;
const OTP_MAX_VERIFY_ATTEMPTS = 10;

@Injectable()
export class OtpService {
	private readonly logger = new Logger(OtpService.name);
	private readonly exposeDevOtp: boolean;

	constructor(
		private readonly redisService: RedisService,
		private readonly emailService: EmailService,
		private readonly configService: ConfigService,
		private readonly userRepository: UserRepository,
	) {
		// Only expose OTP in responses when explicitly enabled via env flag.
		// Never use a predictable code — real random OTP is used in all environments.
		this.exposeDevOtp = process.env['EXPOSE_DEV_OTP'] === 'true';
	}

	// ─── Helpers ─────────────────────────────────────────────────────────────────

	private generateCode(): string {
		return crypto.randomInt(100000, 1000000).toString();
	}

	private async checkAndSetRateLimit(
		dailyKey: string,
		cooldownKey: string,
	): Promise<void> {
		const count = await this.redisService.incrWithTtlOnce(
			dailyKey,
			24 * 60 * 60,
		);
		if (count > OTP_MAX_SENDS_PER_DAY)
			throw new Error('OTP_DAILY_LIMIT_EXCEEDED');

		if (await this.redisService.exists(cooldownKey))
			throw new Error('OTP_COOLDOWN_ACTIVE');
		await this.redisService.set(cooldownKey, '1', OTP_RESEND_COOLDOWN);
	}

	private async checkAndIncrVerifyAttempt(
		attemptKey: string,
		otpKey: string,
	): Promise<void> {
		const result = await this.redisService.checkAndIncrAttempt(
			attemptKey,
			otpKey,
			OTP_MAX_VERIFY_ATTEMPTS,
		);
		if (result === 'exceeded') throw new Error('OTP_MAX_ATTEMPTS_EXCEEDED');
	}

	// ─── Phone OTP (SMS) ─────────────────────────────────────────────────────────

	async sendPhoneOtp(
		phone: string,
		type: 'register' | 'forgot' | 'change_password' | 'change_phone',
	): Promise<{ devOtp?: string }> {
		await this.checkAndSetRateLimit(
			`otp_daily:${type}:${phone}`,
			`otp_cooldown:${type}:${phone}`,
		);

		const code = this.generateCode();
		const ttl =
			type === 'forgot'
				? OTP_FORGOT_TTL_SECONDS
				: type === 'register'
					? OTP_TTL_SECONDS
					: OTP_CHANGE_PWD_TTL_SECONDS;
		await this.redisService.set(`otp:${type}:${phone}`, code, ttl);

		const user = await this.userRepository.findOne({ phone });

		if (user && user.email) {
			await Promise.all([
				this.redisService.del(`otp:${type}:${user.email}`),
				this.redisService.del(`otp_attempts:${type}:${user.email}`),
			]);
		}

		if (this.exposeDevOtp) {
			this.logger.debug(`[DEV] Phone OTP ${phone} (${type}): ${code}`);
			return { devOtp: code };
		}

		await this.sendSmsEsms(phone, code);
		return {};
	}

	async checkPhoneOtp(
		phone: string,
		code: string,
		type: 'register',
	): Promise<void> {
		const otpKey = `otp:${type}:${phone}`;
		const attemptKey = `otp_attempts:${type}:${phone}`;

		const stored = await this.redisService.get(otpKey);
		if (!stored) throw new Error('OTP_EXPIRED_OR_NOT_FOUND');

		if (stored !== code) {
			await this.checkAndIncrVerifyAttempt(attemptKey, otpKey);
			throw new Error('OTP_INVALID');
		}
		// Intentionally do NOT delete the OTP — the final register step still needs it
	}

	async verifyPhoneOtp(
		phone: string,
		code: string,
		type: 'register' | 'forgot' | 'change_password' | 'change_phone',
	): Promise<void> {
		const otpKey = `otp:${type}:${phone}`;
		const attemptKey = `otp_attempts:${type}:${phone}`;

		const stored = await this.redisService.get(otpKey);
		if (!stored) throw new Error('OTP_EXPIRED_OR_NOT_FOUND');

		if (stored !== code) {
			await this.checkAndIncrVerifyAttempt(attemptKey, otpKey);
			throw new Error('OTP_INVALID');
		}

		await Promise.all([
			this.redisService.del(otpKey),
			this.redisService.del(attemptKey),
		]);
	}

	// ─── Email Verification Token ──────────────────────────────────────

	async sendEmailVerificationToken(
		email: string,
		token: string,
		frontendUrl: string,
	): Promise<void> {
		await this.checkAndSetRateLimit(
			`otp_daily:email_verify:${email}`,
			`otp_cooldown:email_verify:${email}`,
		);

		await this.redisService.set(`email_verify:${token}`, email, 24 * 60 * 60);

		const link = `${frontendUrl}/verify-email?token=${token}`;
		if (this.exposeDevOtp) {
			this.logger.debug(`[DEV] Email verify link for ${email}: ${link}`);
		}

		const backendDomain =
			this.configService.get<string>(ConfigKeys.BACKEND_DOMAIN, {
				infer: true,
			}) ?? 'http://localhost:9000';
		const emailLogoUrl = this.configService.get<string>(
			ConfigKeys.EMAIL_LOGO_URL,
			{ infer: true },
		);

		void this.emailService.sendMail({
			to: email,
			subject: '[VietGreenX] Verify your email',
			html: generateEmailVerification({
				link,
				backendDomain,
				logoUrlOverride: emailLogoUrl,
			}),
		});
	}

	async verifyEmailToken(token: string): Promise<string> {
		const email = await this.redisService.get(`email_verify:${token}`);
		if (!email) throw new Error('EMAIL_TOKEN_EXPIRED_OR_INVALID');
		await this.redisService.del(`email_verify:${token}`);
		return email;
	}

	async sendEmailOtp(
		email: string,
		type: 'change_email' | 'forgot' | 'change_password',
	): Promise<{ devOtp?: string }> {
		await this.checkAndSetRateLimit(
			`otp_daily:${type}:${email}`,
			`otp_cooldown:${type}:${email}`,
		);

		const code = this.generateCode();

		const ttl =
			type === 'forgot'
				? OTP_FORGOT_TTL_SECONDS
				: type === 'change_email'
					? OTP_CHANGE_EMAIL_TTL_SECONDS
					: OTP_CHANGE_PWD_TTL_SECONDS;

		await this.redisService.set(`otp:${type}:${email}`, code, ttl);

		const user = await this.userRepository.findOne({ email });
		if (user && user.phone) {
			await Promise.all([
				this.redisService.del(`otp:${type}:${user.phone}`),
				this.redisService.del(`otp_attempts:${type}:${user.phone}`),
			]);
		}

		if (this.exposeDevOtp) {
			this.logger.debug(`[DEV] Email OTP ${email} (${type}): ${code}`);
			return { devOtp: code };
		}

		let emailData: { subject: string; html: string };
		if (type === 'change_email') {
			emailData = generateChangeEmailOtpTemplate(code);
		} else if (type === 'forgot') {
			emailData = generateForgotOtpTemplate(code);
		} else {
			emailData = generateChangePasswordOtpTemplate(code);
		}

		void this.emailService.sendMail({
			to: email,
			subject: emailData.subject,
			html: emailData.html,
		});

		return {};
	}

	async verifyEmailOtp(
		email: string,
		code: string,
		type: 'change_email' | 'forgot' | 'change_password',
	): Promise<void> {
		const otpKey = `otp:${type}:${email}`;

		const attemptKey = `otp_attempts:${type}:${email}`;

		const stored = await this.redisService.get(otpKey);

		if (!stored) throw new Error('OTP_EXPIRED_OR_NOT_FOUND');

		if (stored !== code) {
			await this.checkAndIncrVerifyAttempt(attemptKey, otpKey);
			throw new Error('OTP_INVALID');
		}

		await Promise.all([
			this.redisService.del(otpKey),
			this.redisService.del(attemptKey),
		]);
	}

	// ─── SMS Provider ─────────────────────────────────────────────────────────────

	private async sendSmsEsms(phone: string, _code: string): Promise<void> {
		this.logger.log(`[SMS] Sending OTP to ${phone} via ESMS`);
	}
}
