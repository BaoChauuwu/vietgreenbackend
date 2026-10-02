import {
	Body,
	Controller,
	HttpCode,
	HttpStatus,
	Post,
	UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AdminAuthService } from './admin-auth.service';
import { Responser } from '@app/common/decorators/responser.decorator';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminLoginRequestDto } from './dto/requests/auth-login.request.dto';
import { AuthLoginResponseDto } from './dto/responses/auth-login.resonse.dto';
import { AuthGuard } from '@app/common/guards/auth.guard';
import { AdminChangePasswordRequestDto } from './dto/requests/change-password.request.dto';
import { CurrentUser } from '@app/common/decorators/current-user.decorator';
import { User } from '@app/database/typeorm/entities/identity/user.entity';
import { AdminForgotPasswordRequestDto } from './dto/requests/forgot-password,request.dto';
import { TwoFactorCodeRequestDto } from './dto/requests/two-factor-code.request.dto';
import { TwoFactorActionRequestDto } from './dto/requests/two-factor-action.request.dto';
import { TwoFactorVerifyLoginRequestDto } from './dto/requests/two-factor-verify-login.request.dto';
import { TwoFactorSetupResponseDto } from './dto/responses/two-factor-setup.response.dto';
import { TwoFactorBackupCodesResponseDto } from './dto/responses/two-factor-backup-codes.response.dto';
import { AdminForgotPasswordResponseDto } from './dto/responses/forgot-password.response.dto';
import { toDto } from '@app/common/transformers/dto.transformer';

@ApiTags('Admin / Auth')
@Controller('admin')
export class AdminAuthController {
	constructor(private readonly adminAuthService: AdminAuthService) {}

	@Post('login')
	@Throttle({ default: { limit: 5, ttl: 60000 } })
	@ApiOperation({ summary: '[PUBLIC] Login (step 1)' })
	@Responser.handle('login')
	@HttpCode(HttpStatus.OK)
	async login(@Body() loginDto: AdminLoginRequestDto) {
		const result = await this.adminAuthService.login(loginDto);
		return toDto(AuthLoginResponseDto, result);
	}

	@Post('change-password')
	@ApiBearerAuth()
	@ApiOperation({ summary: '[ADMIN] Change password' })
	@Responser.handle('Change password')
	@UseGuards(AuthGuard)
	@HttpCode(HttpStatus.OK)
	async changePassword(
		@Body() input: AdminChangePasswordRequestDto,
		@CurrentUser() user: User,
	) {
		await this.adminAuthService.changePassword(user.id, input);
		return null;
	}

	@Post('forgot-password')
	@Throttle({ default: { limit: 5, ttl: 300000 } })
	@ApiOperation({ summary: '[PUBLIC] Forgot password' })
	@Responser.handle('Forgot password')
	@HttpCode(HttpStatus.OK)
	async forgotPassword(@Body() input: AdminForgotPasswordRequestDto) {
		const result = await this.adminAuthService.forgotPassword(input);
		return toDto(AdminForgotPasswordResponseDto, result);
	}

	// ──────────────────────────────────────────────────────────────
	// 2FA endpoints
	// ──────────────────────────────────────────────────────────────

	@Post('2fa/verify-login')
	@Throttle({ default: { limit: 10, ttl: 60000 } })
	@ApiOperation({
		summary: '[PUBLIC] Complete login with TOTP or backup code (step 2)',
	})
	@Responser.handle('2FA verified')
	@HttpCode(HttpStatus.OK)
	async verifyTwoFactorLogin(@Body() dto: TwoFactorVerifyLoginRequestDto) {
		const result = await this.adminAuthService.verifyTwoFactorLogin(dto);
		return toDto(AuthLoginResponseDto, result);
	}

	@Post('2fa/setup')
	@ApiBearerAuth()
	@ApiOperation({ summary: '[ADMIN] Generate TOTP secret and QR URI' })
	@Responser.handle('2FA setup')
	@UseGuards(AuthGuard)
	@HttpCode(HttpStatus.OK)
	async setup2FA(@CurrentUser() user: User) {
		const result = await this.adminAuthService.setup2FA(user.id);
		return toDto(TwoFactorSetupResponseDto, result);
	}

	@Post('2fa/enable')
	@ApiBearerAuth()
	@ApiOperation({ summary: '[ADMIN] Verify TOTP code to enable 2FA' })
	@Responser.handle('2FA enabled')
	@UseGuards(AuthGuard)
	@HttpCode(HttpStatus.OK)
	async enable2FA(
		@CurrentUser() user: User,
		@Body() dto: TwoFactorCodeRequestDto,
	) {
		const result = await this.adminAuthService.enable2FA(user.id, dto);
		return toDto(TwoFactorBackupCodesResponseDto, result);
	}

	@Post('2fa/reset-setup')
	@ApiBearerAuth()
	@ApiOperation({
		summary:
			'[ADMIN] Clear in-progress 2FA setup (allows calling /setup again)',
	})
	@Responser.handle('2FA setup reset')
	@UseGuards(AuthGuard)
	@HttpCode(HttpStatus.OK)
	async resetSetup2FA(@CurrentUser() user: User) {
		await this.adminAuthService.resetSetup2FA(user.id);
		return null;
	}

	@Post('2fa/disable')
	@ApiBearerAuth()
	@ApiOperation({
		summary: '[ADMIN] Disable 2FA (requires TOTP code or backup code)',
	})
	@Responser.handle('2FA disabled')
	@UseGuards(AuthGuard)
	@HttpCode(HttpStatus.OK)
	async disable2FA(
		@CurrentUser() user: User,
		@Body() dto: TwoFactorActionRequestDto,
	) {
		await this.adminAuthService.disable2FA(user.id, dto);
		return null;
	}

	@Post('2fa/backup-codes/regenerate')
	@ApiBearerAuth()
	@ApiOperation({
		summary:
			'[ADMIN] Regenerate backup codes (requires TOTP code or backup code)',
	})
	@Responser.handle('Backup codes regenerated')
	@UseGuards(AuthGuard)
	@HttpCode(HttpStatus.OK)
	async regenerateBackupCodes(
		@CurrentUser() user: User,
		@Body() dto: TwoFactorActionRequestDto,
	) {
		const result = await this.adminAuthService.regenerateBackupCodes(
			user.id,
			dto,
		);
		return toDto(TwoFactorBackupCodesResponseDto, result);
	}
}
