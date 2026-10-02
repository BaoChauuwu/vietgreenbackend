import {
	Body,
	Controller,
	Delete,
	Get,
	HttpCode,
	HttpStatus,
	Param,
	ParseUUIDPipe,
	Post,
	Query,
	Req,
	UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Request } from 'express';
import { AppAuthService } from './app-auth.service';
import { AppAuthGuard } from './app-auth.guard';
import { CurrentUser } from '@app/common/decorators/current-user.decorator';
import { Responser } from '@app/common/decorators/responser.decorator';
import { User } from '@app/database/typeorm/entities/identity/user.entity';
import { toDto, toDtos } from '@app/common/transformers/dto.transformer';
import { RegisterPhoneRequestDto } from './dto/requests/register-phone.request.dto';
import { CheckPhoneOtpRequestDto } from './dto/requests/check-phone-otp.request.dto';
import { VerifyPhoneOtpRequestDto } from './dto/requests/verify-phone-otp.request.dto';
import { RegisterEmailRequestDto } from './dto/requests/register-email.request.dto';
import { VerifyEmailTokenRequestDto } from './dto/requests/verify-email-token.request.dto';
import { LoginRequestDto } from './dto/requests/login.request.dto';
import { RefreshTokenRequestDto } from './dto/requests/refresh-token.request.dto';
import { ForgotPasswordRequestDto } from './dto/requests/forgot-password.request.dto';
import { ResetPasswordRequestDto } from './dto/requests/reset-password.request.dto';
import { LogoutRequestDto } from './dto/requests/logout.request.dto';
import { CheckUsernameQueryDto } from './dto/requests/check-username.query.dto';
import { AuthTokenResponseDto } from './dto/responses/auth-token.response.dto';
import { SessionResponseDto } from './dto/responses/session.response.dto';
import { CheckUsernameResponseDto } from './dto/responses/check-username.response.dto';
import { CheckOtpResponseDto } from './dto/responses/check-otp.response.dto';
import { SendOtpResponseDto } from '../account/dto/responses/send-otp.response.dto';

@ApiTags('App / Auth')
@Controller('app/auth')
export class AppAuthController {
	constructor(private readonly appAuthService: AppAuthService) {}

	@Post('register/phone')
	@Throttle({ default: { limit: 50, ttl: 60000 } })
	@ApiOperation({ summary: '[PUBLIC] Register by phone — send OTP' })
	@Responser.handle('Send OTP for registration')
	@HttpCode(HttpStatus.OK)
	async registerPhone(@Body() dto: RegisterPhoneRequestDto) {
		const result = await this.appAuthService.registerPhone(dto);
		return toDto(SendOtpResponseDto, result ?? {});
	}

	@Post('register/phone/check-otp')
	@Throttle({ default: { limit: 50, ttl: 60000 } })
	@ApiOperation({
		summary: '[PUBLIC] Validate registration OTP without consuming it',
	})
	@Responser.handle('Check OTP')
	@HttpCode(HttpStatus.OK)
	async checkPhoneOtp(@Body() dto: CheckPhoneOtpRequestDto) {
		const result = await this.appAuthService.checkRegisterPhoneOtp(dto);
		return toDto(CheckOtpResponseDto, result);
	}

	@Post('register/phone/verify')
	@Throttle({ default: { limit: 50, ttl: 60000 } })
	@ApiOperation({ summary: '[PUBLIC] Verify OTP phone and create account' })
	@Responser.handle('Verify OTP and create account')
	@HttpCode(HttpStatus.CREATED)
	async verifyPhoneOtp(
		@Body() dto: VerifyPhoneOtpRequestDto,
		@Req() req: Request,
	) {
		const result = await this.appAuthService.verifyPhoneOtp(
			dto,
			req.ip,
			req.headers['user-agent'],
		);
		return toDto(AuthTokenResponseDto, result);
	}

	@Post('register/email')
	@Throttle({ default: { limit: 5, ttl: 60000 } })
	@ApiOperation({
		summary: '[PUBLIC] Register by email — send verification link',
	})
	@Responser.handle('Send verification link')
	@HttpCode(HttpStatus.OK)
	async registerEmail(@Body() dto: RegisterEmailRequestDto) {
		await this.appAuthService.registerEmail(dto);
		return null;
	}

	@Post('register/email/verify')
	@ApiOperation({ summary: '[PUBLIC] Verify email token and create account' })
	@Responser.handle('Verify email and create account')
	@HttpCode(HttpStatus.CREATED)
	async verifyEmailToken(
		@Body() dto: VerifyEmailTokenRequestDto,
		@Req() req: Request,
	) {
		const result = await this.appAuthService.verifyEmailToken(
			dto,
			req.ip,
			req.headers['user-agent'],
		);
		return toDto(AuthTokenResponseDto, result);
	}

	@Post('login')
	@Throttle({ default: { limit: 10, ttl: 60000 } })
	@ApiOperation({ summary: '[PUBLIC] Login by phone/email + password' })
	@Responser.handle('Login')
	@HttpCode(HttpStatus.OK)
	async login(@Body() dto: LoginRequestDto, @Req() req: Request) {
		const result = await this.appAuthService.login(
			dto,
			req.ip,
			req.headers['user-agent'],
		);
		return toDto(AuthTokenResponseDto, result);
	}

	@Post('refresh')
	@ApiOperation({ summary: '[PUBLIC] Refresh access token by refresh token' })
	@Responser.handle('Refresh token')
	@HttpCode(HttpStatus.OK)
	async refreshToken(@Body() dto: RefreshTokenRequestDto, @Req() req: Request) {
		const result = await this.appAuthService.refreshToken(dto, req.ip);
		return toDto(AuthTokenResponseDto, result);
	}

	@Post('logout')
	@ApiOperation({ summary: '[PUBLIC] Logout — revoke refresh token' })
	@Responser.handle('Logout')
	@HttpCode(HttpStatus.OK)
	async logout(@Body() dto: LogoutRequestDto) {
		await this.appAuthService.logout(dto);
		return null;
	}

	@Get('sessions')
	@ApiBearerAuth()
	@UseGuards(AppAuthGuard)
	@ApiOperation({ summary: '[AUTH] Get active sessions' })
	@Responser.handle('Get active sessions')
	@HttpCode(HttpStatus.OK)
	async getSessions(@CurrentUser() user: User, @Req() req: Request) {
		const refreshToken = req.headers['x-refresh-token'] as string | undefined;
		const result = await this.appAuthService.getSessions(user.id, refreshToken);
		return toDtos(SessionResponseDto, result);
	}

	@Delete('sessions/:id')
	@ApiBearerAuth()
	@UseGuards(AppAuthGuard)
	@ApiOperation({ summary: '[AUTH] Revoke a session by ID' })
	@Responser.handle('Revoke session')
	@HttpCode(HttpStatus.OK)
	async revokeSession(
		@Param('id', ParseUUIDPipe) sessionId: string,
		@CurrentUser() user: User,
	) {
		await this.appAuthService.revokeSession(sessionId, user.id);
		return null;
	}

	@Delete('sessions')
	@ApiBearerAuth()
	@UseGuards(AppAuthGuard)
	@ApiOperation({ summary: '[AUTH] Logout from all devices' })
	@Responser.handle('Logout from all devices')
	@HttpCode(HttpStatus.OK)
	async revokeAllSessions(@CurrentUser() user: User) {
		await this.appAuthService.revokeAllSessions(user.id);
		return null;
	}

	@Post('forgot-password')
	@Throttle({ default: { limit: 5, ttl: 60000 } })
	@ApiOperation({
		summary: '[PUBLIC] Forgot password — send OTP via phone or email',
	})
	@Responser.handle('Send OTP forgot password')
	@HttpCode(HttpStatus.OK)
	async forgotPassword(@Body() dto: ForgotPasswordRequestDto) {
		const result = await this.appAuthService.forgotPassword(dto);
		return toDto(SendOtpResponseDto, result ?? {});
	}

	@Post('reset-password')
	@Throttle({ default: { limit: 10, ttl: 60000 } })
	@ApiOperation({ summary: '[PUBLIC] Reset password by OTP' })
	@Responser.handle('Reset password')
	@HttpCode(HttpStatus.OK)
	async resetPassword(@Body() dto: ResetPasswordRequestDto) {
		await this.appAuthService.resetPassword(dto);
		return null;
	}

	@Get('check-username')
	@ApiOperation({ summary: '[PUBLIC] Check if username is available' })
	@Responser.handle('Check username availability')
	@HttpCode(HttpStatus.OK)
	async checkUsername(@Query() query: CheckUsernameQueryDto) {
		const result = await this.appAuthService.checkUsernameAvailability(
			query.username,
		);
		return toDto(CheckUsernameResponseDto, result);
	}
}
