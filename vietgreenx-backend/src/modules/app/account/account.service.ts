import { Injectable, Logger } from '@nestjs/common';
import { HttpBadRequestError } from '@app/common/errors/bad-request.error';
import { HttpNotFoundError } from '@app/common/errors/not-found.error';
import { SendChangePasswordOtpRequestDto } from './dto/requests/send-change-password-otp.request.dto';
import { ChangePasswordRequestDto } from './dto/requests/change-password.request.dto';
import { ChangeEmailRequestDto } from './dto/requests/change-email.request.dto';
import { ChangeEmailVerifyOtpRequestDto } from './dto/requests/change-email-verify-otp.request.dto';
import { SendChangePhoneOtpRequestDto } from './dto/requests/send-change-phone-otp.request.dto';
import { ChangePhoneVerifyOtpRequestDto } from './dto/requests/change-phone-verify-otp.request.dto';
import { DeleteAccountRequestDto } from './dto/requests/delete-account.request.dto';
import { User } from '@app/database/typeorm/entities/identity/user.entity';
import { normalizeVietnamesePhone } from '@app/common/utils/normalize-vietnamese-phone';
import { OtpService } from '@app/services/otp/otp.service';
import * as bcrypt from 'bcrypt';
import { UserRepository } from '@app/database/typeorm/repositories/user.repository';
import { ErrorCode } from '@app/common/errors/error-code';
import { OtpChannel } from '@app/common/enums/otp-channel.enum';
import { AppAuthService } from '@app/modules/app/app-auth/app-auth.service';
import { UserStatus } from '@app/common/enums/user-status.enum';
import { S3Service } from '@app/services/aws/s3/s3.service';
import { ExportPersonalDataResponseDto } from './dto/responses/export-personal-data.response.dto';
import { AccountCredentialsResponseDto } from './dto/responses/account-credentials.response.dto';
import { maskEmail, maskVietnamesePhone } from '@app/common/utils/mask-contact';

const BCRYPT_ROUNDS = 10;

@Injectable()
export class AccountService {
	private readonly logger = new Logger(AccountService.name);

	constructor(
		private readonly otpService: OtpService,
		private readonly userRepository: UserRepository,
		private readonly appAuthService: AppAuthService,
		private readonly s3Service: S3Service,
	) {}

	async sendOtpChangePassword(
		user: User,
		dto: SendChangePasswordOtpRequestDto,
	): Promise<{ devOtp?: string } | null> {
		const isMatch = await bcrypt.compare(
			dto.currentPassword,
			user.passwordHash,
		);
		if (!isMatch) {
			throw new HttpBadRequestError(ErrorCode.INCORRECT_CURRENT_PASSWORD);
		}

		if (dto.channel === OtpChannel.EMAIL) {
			if (!user.email) {
				throw new HttpBadRequestError(ErrorCode.EMAIL_NOT_FOUND);
			}

			const result = await this.otpService.sendEmailOtp(
				user.email,
				'change_password',
			);
			return result.devOtp ? { devOtp: result.devOtp } : null;
		}

		if (!user.phone) {
			throw new HttpBadRequestError(ErrorCode.PHONE_NOT_FOUND);
		}
		const result = await this.otpService.sendPhoneOtp(
			user.phone,
			'change_password',
		);
		return result.devOtp ? { devOtp: result.devOtp } : null;
	}

	async verifyChangePasswordOtp(
		user: User,
		dto: ChangePasswordRequestDto,
	): Promise<{ devOtp?: string } | null> {
		if (dto.newPassword !== dto.verifyPassword) {
			throw new HttpBadRequestError(ErrorCode.NEW_PASSWORD_NOT_MATCH);
		}

		const isMatch = await bcrypt.compare(
			dto.currentPassword,
			user.passwordHash,
		);

		if (!isMatch) {
			throw new HttpBadRequestError(ErrorCode.INCORRECT_CURRENT_PASSWORD);
		}

		if (await bcrypt.compare(dto.newPassword, user.passwordHash)) {
			throw new HttpBadRequestError(ErrorCode.NEW_PASSWORD_SAME_AS_CURRENT);
		}

		await this.appAuthService.checkPasswordHistory(user.id, dto.newPassword);

		if (dto.channel === OtpChannel.EMAIL) {
			if (!user.email) {
				throw new HttpBadRequestError(ErrorCode.EMAIL_NOT_FOUND);
			}
			await this.otpService
				.verifyEmailOtp(user.email, dto.otp, 'change_password')
				.catch((err) => {
					throw new HttpBadRequestError(this.mapOtpError(err.message));
				});
		} else {
			if (!user.phone) {
				throw new HttpBadRequestError(ErrorCode.PHONE_NOT_FOUND);
			}
			await this.otpService
				.verifyPhoneOtp(user.phone, dto.otp, 'change_password')
				.catch((err) => {
					throw new HttpBadRequestError(this.mapOtpError(err.message));
				});
		}

		const newHash = await bcrypt.hash(dto.newPassword, BCRYPT_ROUNDS);
		await this.userRepository.executeInTransaction(async (manager) => {
			await manager
				.createQueryBuilder()
				.update(User)
				.set({ passwordHash: newHash, version: () => 'version + 1' })
				.where('id = :id', { id: user.id })
				.execute();
		});

		await this.appAuthService.savePasswordHistory(user.id, newHash);
		await this.appAuthService.revokeAllSessions(user.id, {
			bumpVersion: false,
		});

		return null;
	}

	async sendOtpChangeEmail(
		user: User,
		dto: ChangeEmailRequestDto,
	): Promise<{ devOtp?: string } | null> {
		const existEmail = await this.userRepository.findOne({
			email: dto.newEmail,
		});

		if (existEmail) {
			throw new HttpBadRequestError(ErrorCode.EMAIL_EXISTS);
		}

		const isMatch = await bcrypt.compare(
			dto.currentPassword,
			user.passwordHash,
		);

		if (!isMatch) {
			throw new HttpBadRequestError(ErrorCode.INCORRECT_CURRENT_PASSWORD);
		}

		const result = await this.otpService.sendEmailOtp(
			dto.newEmail,
			'change_email',
		);

		return result.devOtp ? { devOtp: result.devOtp } : null;
	}

	async verifyChangeEmailOtp(
		user: User,
		dto: ChangeEmailVerifyOtpRequestDto,
	): Promise<{ devOtp?: string } | null> {
		await this.otpService
			.verifyEmailOtp(dto.newEmail, dto.otp, 'change_email')
			.catch((err) => {
				throw new HttpBadRequestError(this.mapOtpError(err.message));
			});

		await this.userRepository.executeInTransaction(async (manager) => {
			const existed = await manager.findOne(User, {
				where: { email: dto.newEmail },
			});
			if (existed) {
				throw new HttpBadRequestError(ErrorCode.EMAIL_EXISTS);
			}

			await manager
				.createQueryBuilder()
				.update(User)
				.set({
					email: dto.newEmail,
					emailVerified: true,
					version: () => 'version + 1',
				})
				.where('id = :id', { id: user.id })
				.execute();
		});

		await this.appAuthService.revokeAllSessions(user.id, {
			bumpVersion: false,
		});

		return null;
	}

	async sendOtpChangePhone(
		user: User,
		dto: SendChangePhoneOtpRequestDto,
	): Promise<{ devOtp?: string } | null> {
		const newPhone = normalizeVietnamesePhone(dto.newPhone);
		const existPhone = await this.userRepository.findOne({
			phone: newPhone,
		});

		if (existPhone) {
			throw new HttpBadRequestError(ErrorCode.PHONE_ALREADY_EXISTS);
		}

		const isMatch = await bcrypt.compare(
			dto.currentPassword,
			user.passwordHash,
		);

		if (!isMatch) {
			throw new HttpBadRequestError(ErrorCode.INCORRECT_CURRENT_PASSWORD);
		}

		const result = await this.otpService.sendPhoneOtp(newPhone, 'change_phone');

		return result.devOtp ? { devOtp: result.devOtp } : null;
	}

	async verifyOtpChangePhone(
		user: User,
		dto: ChangePhoneVerifyOtpRequestDto,
	): Promise<{ devOtp?: string } | null> {
		const newPhone = normalizeVietnamesePhone(dto.newPhone);
		await this.otpService
			.verifyPhoneOtp(newPhone, dto.otp, 'change_phone')
			.catch((err) => {
				throw new HttpBadRequestError(this.mapOtpError(err.message));
			});

		await this.userRepository.executeInTransaction(async (manager) => {
			const existed = await manager.findOne(User, {
				where: { phone: newPhone },
			});
			if (existed) {
				throw new HttpBadRequestError(ErrorCode.PHONE_ALREADY_EXISTS);
			}

			await manager
				.createQueryBuilder()
				.update(User)
				.set({
					phone: newPhone,
					phoneVerified: true,
					version: () => 'version + 1',
				})
				.where('id = :id', { id: user.id })
				.execute();
		});

		await this.appAuthService.revokeAllSessions(user.id, {
			bumpVersion: false,
		});

		return null;
	}

	async getCredentials(user: User): Promise<AccountCredentialsResponseDto> {
		const emailPresent = user.email != null;
		const phonePresent = user.phone != null;

		return {
			email: {
				present: emailPresent,
				verified: user.emailVerified,
				masked: emailPresent ? maskEmail(user.email!) : null,
			},
			phone: {
				present: phonePresent,
				verified: user.phoneVerified,
				masked: phonePresent ? maskVietnamesePhone(user.phone!) : null,
			},
			registeredWith: user.signupChannel ?? null,
		};
	}

	async deleteAccount(
		user: User,
		dto: DeleteAccountRequestDto,
	): Promise<{ devOtp?: string } | null> {
		const isMatch = await bcrypt.compare(
			dto.currentPassword,
			user.passwordHash,
		);

		if (!isMatch) {
			throw new HttpBadRequestError(ErrorCode.INCORRECT_CURRENT_PASSWORD);
		}

		await this.userRepository.executeInTransaction(async (manager) => {
			await manager
				.createQueryBuilder()
				.update(User)
				.set({ status: UserStatus.DEACTIVATED, version: () => 'version + 1' })
				.where('id = :id', { id: user.id })
				.execute();
			await manager.softDelete(User, user.id);
		});

		await this.appAuthService.revokeAllSessions(user.id, {
			bumpVersion: false,
		});

		return null;
	}

	async exportPersonalData(user: User): Promise<ExportPersonalDataResponseDto> {
		const fullUserData = await this.userRepository.findOne({ id: user.id }, [
			'profile',
		]);

		if (!fullUserData) {
			throw new HttpNotFoundError(ErrorCode.USER_NOT_FOUND);
		}

		const {
			passwordHash: _pw,
			id: _id,
			createdAt: _ca,
			updatedAt: _ua,
			deletedAt: _da,
			profile,
			...rest
		} = fullUserData;

		const profileData = profile
			? (({
					id: _pid,
					userId: _puid,
					createdAt: _pca,
					updatedAt: _pua,
					...p
				}) => p)(profile)
			: undefined;

		const data = { ...rest, ...(profileData ? { profile: profileData } : {}) };

		const csvContent = this.jsonToCsv(data);
		const buffer = Buffer.from(csvContent, 'utf-8');
		const uploadResult = await this.s3Service.uploadPrivateFile(
			`personal_data_${user.id}.csv`,
			buffer,
			'text/csv',
		);

		const presignedUrl = await this.s3Service.getPresignedUrl(
			uploadResult.key,
			900,
			`personal_data_${user.username || user.id}.csv`,
		);

		return {
			fileName: `personal_data_${user.username || user.id}.csv`,
			fileUrl: presignedUrl,
			expiresIn: '900 seconds',
		};
	}

	private jsonToCsv(data: any): string {
		const flatData: Record<string, string> = {};

		for (const [key, value] of Object.entries(data)) {
			if (value && typeof value === 'object' && !Array.isArray(value)) {
				for (const [subKey, subValue] of Object.entries(value)) {
					flatData[`${key}_${subKey}`] = String(subValue ?? '');
				}
			} else {
				flatData[key] = String(value ?? '');
			}
		}

		const headers = Object.keys(flatData);
		const values = Object.values(flatData);

		return [
			headers.join(','),
			values.map((v) => `"${v.replace(/"/g, '""')}"`).join(','),
		].join('\n');
	}

	private mapOtpError(code: string): ErrorCode {
		const map: Record<string, ErrorCode> = {
			OTP_INVALID: ErrorCode.INVALID_OTP,
			OTP_EXPIRED_OR_NOT_FOUND: ErrorCode.OTP_EXPIRED_OR_NOT_FOUND,
			OTP_MAX_ATTEMPTS_EXCEEDED: ErrorCode.OTP_MAX_ATTEMPTS_EXCEEDED,
			OTP_DAILY_LIMIT_EXCEEDED: ErrorCode.OTP_DAILY_LIMIT_EXCEEDED,
			OTP_COOLDOWN_ACTIVE: ErrorCode.OTP_COOLDOWN_ACTIVE,
		};
		return map[code] ?? ErrorCode.INTERNAL_SERVER_ERROR;
	}
}
