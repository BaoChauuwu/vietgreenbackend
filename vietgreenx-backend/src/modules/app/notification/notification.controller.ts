import {
	Body,
	Controller,
	Delete,
	Get,
	HttpCode,
	HttpStatus,
	Param,
	ParseUUIDPipe,
	Patch,
	Post,
	Query,
	UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AppAuthGuard } from '../app-auth/app-auth.guard';
import { Responser } from '@app/common/decorators/responser.decorator';
import { CurrentUser } from '@app/common/decorators/current-user.decorator';
import { NotificationQueryRequest } from './dto/requests/notification-query.request.dto';
import { RegisterDeviceRequestDto } from './dto/requests/register-device.request.dto';
import { UnregisterDeviceRequestDto } from './dto/requests/unregister-device.request.dto';
import { NotificationService } from './notification.service';
import { User } from '@app/database/typeorm/entities/identity/user.entity';
import { toDto, toDtos } from '@app/common/transformers/dto.transformer';
import { NotificationsResponseDto } from './dto/responses/notifications.response.dto';
import { CountUnReadNotificationResponse } from './dto/responses/count-unread-notification.response.dto';
import { NotificationResponseDto } from './dto/responses/notification.response.dto';

@ApiTags('App / Notifications')
@ApiBearerAuth()
@UseGuards(AppAuthGuard)
@Controller('app/notifications')
export class NotificationController {
	constructor(private readonly notificationService: NotificationService) {}

	@Post('device')
	@ApiOperation({ summary: '[AUTH] register / refresh FCM device token' })
	@HttpCode(HttpStatus.OK)
	@Responser.handle('Register device')
	async registerDevice(
		@CurrentUser() user: User,
		@Body() dto: RegisterDeviceRequestDto,
	) {
		await this.notificationService.registerDevice(
			user.id,
			dto.fcmToken,
			dto.platform,
		);
		return null;
	}

	@Delete('device')
	@ApiOperation({ summary: '[AUTH] unregister FCM device token' })
	@HttpCode(HttpStatus.OK)
	@Responser.handle('Unregister device')
	async unregisterDevice(@Body() dto: UnregisterDeviceRequestDto) {
		await this.notificationService.unregisterDevice(dto.fcmToken);
		return null;
	}

	@Get()
	@ApiOperation({ summary: '[AUTH] get list notification' })
	@HttpCode(HttpStatus.OK)
	@Responser.handle('Get list notifcation')
	async getListNotification(
		@CurrentUser() user: User,
		@Query() query: NotificationQueryRequest,
	) {
		const result = await this.notificationService.findAll(user.id, query);
		return toDto(NotificationsResponseDto, {
			items: toDtos(NotificationResponseDto, result.data),
			nextCursor: result.nextCursor ?? null,
			hasNext: result.hasNext,
			limit: result.limit,
		});
	}

	@Get('unread-count')
	@ApiOperation({ summary: '[AUTH] count unread notification ' })
	@HttpCode(HttpStatus.OK)
	@Responser.handle('Count unread notification')
	async getUnreadCount(@CurrentUser() user: User) {
		const result = await this.notificationService.getUnreadCount(user.id);
		return toDto(CountUnReadNotificationResponse, result);
	}

	@Patch('read-all')
	@ApiOperation({ summary: '[AUTH] mark read all notifications' })
	@HttpCode(HttpStatus.OK)
	@Responser.handle('Mark read all notifications successfully')
	async markAllAsRead(@CurrentUser() user: User) {
		await this.notificationService.markAllAsRead(user.id);
		return null;
	}

	@Patch(':id/read')
	@ApiOperation({ summary: '[AUTH] mark isRead notification' })
	@HttpCode(HttpStatus.OK)
	@Responser.handle('Mark isRead notification')
	async markAsRead(
		@CurrentUser() user: User,
		@Param('id', ParseUUIDPipe) notiId: string,
	) {
		const result = await this.notificationService.markAsRead(user.id, notiId);
		return toDto(NotificationResponseDto, result);
	}
}
