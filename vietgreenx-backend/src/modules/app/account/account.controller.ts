import {
	Body,
	Controller,
	Get,
	HttpCode,
	HttpStatus,
	Post,
	UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AccountService } from './account.service';
import { Responser } from '@app/common/decorators/responser.decorator';
import { AppAuthGuard } from '@app/modules/app/app-auth/app-auth.guard';
import { CurrentUser } from '@app/common/decorators/current-user.decorator';
import { User } from '@app/database/typeorm/entities/identity/user.entity';
import { toDto } from '@app/common/transformers/dto.transformer';
import { SendChangePasswordOtpRequestDto } from './dto/requests/send-change-password-otp.request.dto';
import { ChangePasswordRequestDto } from './dto/requests/change-password.request.dto';
import { ChangeEmailRequestDto } from './dto/requests/change-email.request.dto';
import { ChangeEmailVerifyOtpRequestDto } from './dto/requests/change-email-verify-otp.request.dto';
import { SendChangePhoneOtpRequestDto } from './dto/requests/send-change-phone-otp.request.dto';
import { ChangePhoneVerifyOtpRequestDto } from './dto/requests/change-phone-verify-otp.request.dto';
import { DeleteAccountRequestDto } from './dto/requests/delete-account.request.dto';
import { ExportPersonalDataResponseDto } from './dto/responses/export-personal-data.response.dto';
import { AccountCredentialsResponseDto } from './dto/responses/account-credentials.response.dto';
import { SendOtpResponseDto } from './dto/responses/send-otp.response.dto';

@ApiTags('App / Account')
@ApiBearerAuth()
@UseGuards(AppAuthGuard)
@Controller('app/account')
export class AccountController {
	constructor(private readonly accountService: AccountService) {}

	@Post('change-password/send-otp')
	@ApiOperation({ summary: '[AUTH] Send OTP for change password' })
	@Responser.handle('Send OTP for change password')
	@HttpCode(HttpStatus.OK)
	async sendOtpChangePassword(
		@CurrentUser() user: User,
		@Body() dto: SendChangePasswordOtpRequestDto,
	) {
		const result = await this.accountService.sendOtpChangePassword(user, dto);
		return toDto(SendOtpResponseDto, result ?? {});
	}

	@Post('change-password/verify-otp')
	@ApiOperation({ summary: '[AUTH] Verify OTP and change password' })
	@Responser.handle('Verify OTP and change password')
	@HttpCode(HttpStatus.OK)
	async verifyChangePasswordOtp(
		@CurrentUser() user: User,
		@Body() dto: ChangePasswordRequestDto,
	) {
		await this.accountService.verifyChangePasswordOtp(user, dto);
		return null;
	}

	@Post('change-email/send-otp')
	@ApiOperation({ summary: '[AUTH] Send OTP for change email' })
	@Responser.handle('Send OTP for change email')
	@HttpCode(HttpStatus.OK)
	async sendOtpChangeEmail(
		@CurrentUser() user: User,
		@Body() dto: ChangeEmailRequestDto,
	) {
		const result = await this.accountService.sendOtpChangeEmail(user, dto);
		return toDto(SendOtpResponseDto, result ?? {});
	}

	@Post('change-email/verify-otp')
	@ApiOperation({ summary: '[AUTH] Verify OTP and change email' })
	@Responser.handle('Verify OTP and change email')
	@HttpCode(HttpStatus.OK)
	async verifyChangeEmailOtp(
		@CurrentUser() user: User,
		@Body() dto: ChangeEmailVerifyOtpRequestDto,
	) {
		await this.accountService.verifyChangeEmailOtp(user, dto);
		return null;
	}

	@Post('change-phone/send-otp')
	@ApiOperation({ summary: '[AUTH] Send OTP for change phone' })
	@Responser.handle('Send OTP for change phone')
	@HttpCode(HttpStatus.OK)
	async sendOtpChangePhone(
		@CurrentUser() user: User,
		@Body() dto: SendChangePhoneOtpRequestDto,
	) {
		const result = await this.accountService.sendOtpChangePhone(user, dto);
		return toDto(SendOtpResponseDto, result ?? {});
	}

	@Post('change-phone/verify-otp')
	@ApiOperation({ summary: '[AUTH] Verify OTP and change phone' })
	@Responser.handle('Verify OTP and change phone')
	@HttpCode(HttpStatus.OK)
	async verifyOtpChangePhone(
		@CurrentUser() user: User,
		@Body() dto: ChangePhoneVerifyOtpRequestDto,
	) {
		await this.accountService.verifyOtpChangePhone(user, dto);
		return null;
	}

	@Post('delete-account')
	@ApiOperation({ summary: '[AUTH] Delete account' })
	@Responser.handle('Delete account')
	@HttpCode(HttpStatus.OK)
	async deleteAccount(
		@CurrentUser() user: User,
		@Body() dto: DeleteAccountRequestDto,
	) {
		await this.accountService.deleteAccount(user, dto);
		return null;
	}

	@Get('credentials')
	@ApiOperation({
		summary:
			'[AUTH] Get masked login credentials (email/phone) for account settings',
	})
	@Responser.handle('Get account credentials')
	@HttpCode(HttpStatus.OK)
	async getCredentials(@CurrentUser() user: User) {
		const result = await this.accountService.getCredentials(user);
		return toDto(AccountCredentialsResponseDto, result);
	}

	@Get('export-personal-data')
	@ApiOperation({ summary: '[AUTH] Export personal data' })
	@Responser.handle('Export personal data')
	@HttpCode(HttpStatus.OK)
	async exportPersonalData(@CurrentUser() user: User) {
		const result = await this.accountService.exportPersonalData(user);
		return toDto(ExportPersonalDataResponseDto, result);
	}
}
