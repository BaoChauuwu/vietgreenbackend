import {
	Body,
	Controller,
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
import { AuthGuard } from '@app/common/guards/auth.guard';
import { RolesGuard } from '@app/common/guards/roles.guard';
import { Roles } from '@app/common/decorators/roles.decorator';
import { UserRole } from '@app/common/enums/user-role.enum';
import { Responser } from '@app/common/decorators/responser.decorator';
import { AuditLog } from '@app/common/decorators/audit-log.decorator';
import { CurrentUser } from '@app/common/decorators/current-user.decorator';
import { User } from '@app/database/typeorm/entities/identity/user.entity';
import { toDto, toDtos } from '@app/common/transformers/dto.transformer';
import { QrScanTimeseriesQueryDto } from './dto/requests/qr-scan-timeseries.request.dto';
import { AdminDashboardService } from './admin-dashboard.service';
import { CreateAppVersionRequestDto } from './dto/requests/create-app-version.request.dto';
import { UpdateAppVersionRequestDto } from './dto/requests/update-app-version.request.dto';
import { DashboardStatsResponseDto } from './dto/responses/dashboard-stats.response.dto';
import { TopProductResponseDto } from './dto/responses/top-products.response.dto';
import { AppVersionResponseDto } from './dto/responses/app-version.response.dto';

@ApiTags('Admin / Dashboard')
@Controller('admin/dashboard')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminDashboardController {
	constructor(private readonly adminDashboardService: AdminDashboardService) {}

	@Get('stats')
	@ApiOperation({ summary: '[ADMIN] KPI metrics' })
	@Responser.handle('Get dashboard stats')
	@HttpCode(HttpStatus.OK)
	async getStats() {
		const stats = await this.adminDashboardService.getStats();
		return toDto(DashboardStatsResponseDto, stats, { strategy: 'exposeAll' });
	}

	@Get('active-users')
	@ApiOperation({ summary: '[ADMIN] DAU / WAU / MAU active user stats' })
	@Responser.handle('Get active user stats')
	@HttpCode(HttpStatus.OK)
	async getActiveUserStats() {
		return this.adminDashboardService.getActiveUserStats();
	}

	@Get('qr-scan-timeseries')
	@ApiOperation({
		summary: '[ADMIN] QR scan volume over time (day/week/month)',
	})
	@Responser.handle('Get QR scan time-series')
	@HttpCode(HttpStatus.OK)
	async getQrScanTimeSeries(@Query() query: QrScanTimeseriesQueryDto) {
		return this.adminDashboardService.getQrScanTimeSeries(
			query.granularity ?? 'day',
			query.days ?? 30,
		);
	}

	@Get('top-active-users')
	@ApiOperation({ summary: '[ADMIN] Top 10 most active users' })
	@Responser.handle('Get top active users')
	@HttpCode(HttpStatus.OK)
	async getTopActiveUsers() {
		return this.adminDashboardService.getTopActiveUsers();
	}

	@Get('users-by-province')
	@ApiOperation({ summary: '[ADMIN] User distribution by province' })
	@Responser.handle('Get users by province')
	@HttpCode(HttpStatus.OK)
	async getUsersByProvince() {
		return this.adminDashboardService.getUsersByProvince();
	}

	@Get('top-products')
	@ApiOperation({ summary: '[ADMIN] Top 10 most-scanned products' })
	@Responser.handle('Get top products')
	@HttpCode(HttpStatus.OK)
	async getTopProducts() {
		const items = await this.adminDashboardService.getTopProducts();
		return toDtos(TopProductResponseDto, items, { strategy: 'exposeAll' });
	}

	@Get('app-versions')
	@ApiOperation({ summary: '[ADMIN] List all app versions' })
	@Responser.handle('List app versions')
	@HttpCode(HttpStatus.OK)
	async listAppVersions() {
		const versions = await this.adminDashboardService.listAppVersions();
		return toDtos(AppVersionResponseDto, versions);
	}

	@Post('app-versions')
	@AuditLog({ action: 'Create app version', resourceType: 'AppVersion' })
	@ApiOperation({ summary: '[ADMIN] Create or upsert app version' })
	@Responser.handle('Create app version')
	@HttpCode(HttpStatus.CREATED)
	async createAppVersion(
		@Body() dto: CreateAppVersionRequestDto,
		@CurrentUser() admin: User,
	) {
		const version = await this.adminDashboardService.createAppVersion(
			dto,
			admin.id,
		);
		return toDto(AppVersionResponseDto, version);
	}

	@Patch('app-versions/:id')
	@AuditLog({
		action: 'Update app version',
		resourceType: 'AppVersion',
		resourceIdParam: 'id',
	})
	@ApiOperation({ summary: '[ADMIN] Update app version record' })
	@Responser.handle('Update app version')
	@HttpCode(HttpStatus.OK)
	async updateAppVersion(
		@Param('id', ParseUUIDPipe) id: string,
		@Body() dto: UpdateAppVersionRequestDto,
	) {
		const version = await this.adminDashboardService.updateAppVersion(id, dto);
		return toDto(AppVersionResponseDto, version);
	}
}
