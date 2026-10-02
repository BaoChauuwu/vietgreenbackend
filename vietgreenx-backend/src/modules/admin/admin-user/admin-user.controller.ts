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
	Res,
	UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import {
	ApiBearerAuth,
	ApiOperation,
	ApiProduces,
	ApiTags,
} from '@nestjs/swagger';
import { AdminUserService } from './admin-user.service';
import { UserRole } from '@app/common/enums/user-role.enum';
import { User } from '@app/database/typeorm/entities/identity/user.entity';
import { CurrentUser } from '@app/common/decorators/current-user.decorator';
import { Responser } from '@app/common/decorators/responser.decorator';
import { AuthGuard } from '@app/common/guards/auth.guard';
import { RolesGuard } from '@app/common/guards/roles.guard';
import { Roles } from '@app/common/decorators/roles.decorator';
import { AuditLog } from '@app/common/decorators/audit-log.decorator';
import {
	toPaginateDtos,
	toDto,
} from '@app/common/transformers/dto.transformer';
import { AdminUserListQueryDto } from './dto/requests/admin-user-list-query.request.dto';
import { AdminUserChangeRoleRequestDto } from './dto/requests/admin-user-change-role.request.dto';
import { AdminUserChangeStatusRequestDto } from './dto/requests/admin-user-change-status.request.dto';
import { AdminUserAssignPlanRequestDto } from './dto/requests/admin-user-assign-plan.request.dto';
import { AdminUserVerifyRequestDto } from './dto/requests/admin-user-verify.request.dto';
import { AdminUserListItemResponseDto } from './dto/responses/admin-user-list-item.response.dto';
import { AdminUserDetailResponseDto } from './dto/responses/admin-user-detail.response.dto';
import { MembershipService } from '@app/modules/app/membership/membership.service';

@ApiTags('Admin / Users')
@Controller('admin/users')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminUserController {
	constructor(
		private readonly adminUserService: AdminUserService,
		private readonly membershipService: MembershipService,
	) {}

	@Get()
	@ApiOperation({ summary: '[ADMIN] List users with search and filters' })
	@Responser.handle('List users')
	@HttpCode(HttpStatus.OK)
	async findAll(@Query() query: AdminUserListQueryDto) {
		const result = await this.adminUserService.listUsers(query);
		return toPaginateDtos(AdminUserListItemResponseDto, result, {
			strategy: 'exposeAll',
		});
	}

	// Must come before /:id so Express does not match "export" as a UUID.
	@Get('export')
	@ApiOperation({ summary: '[ADMIN] Export user list as CSV' })
	@ApiProduces('text/csv')
	@Responser.handle('Export users CSV')
	@HttpCode(HttpStatus.OK)
	async exportCsv(@Query() query: AdminUserListQueryDto, @Res() res: Response) {
		const csv = await this.adminUserService.exportUsersCsv(query);
		res.setHeader('Content-Type', 'text/csv; charset=utf-8');
		res.setHeader('Content-Disposition', 'attachment; filename="users.csv"');
		res.end(csv);
	}

	@Get(':id')
	@ApiOperation({ summary: '[ADMIN] Get user detail' })
	@Responser.handle('Get user detail')
	@HttpCode(HttpStatus.OK)
	async findOne(@Param('id', ParseUUIDPipe) id: string) {
		const user = await this.adminUserService.getUserDetail(id);
		return toDto(AdminUserDetailResponseDto, user, { strategy: 'exposeAll' });
	}

	@Patch(':id/role')
	@AuditLog({
		action: 'Change user role',
		resourceType: 'User',
		resourceIdParam: 'id',
	})
	@ApiOperation({ summary: '[ADMIN] Change user role' })
	@Responser.handle('Change user role')
	@HttpCode(HttpStatus.OK)
	async changeUserRole(
		@Param('id', ParseUUIDPipe) id: string,
		@Body() dto: AdminUserChangeRoleRequestDto,
		@CurrentUser() admin: User,
	) {
		await this.adminUserService.changeUserRole(id, dto.newRole, admin.id);
		return null;
	}

	@Patch(':id/status')
	@AuditLog({
		action: 'Change user status',
		resourceType: 'User',
		resourceIdParam: 'id',
	})
	@ApiOperation({ summary: '[ADMIN] Lock / unlock / ban a user' })
	@Responser.handle('Change user status')
	@HttpCode(HttpStatus.OK)
	async changeUserStatus(
		@Param('id', ParseUUIDPipe) id: string,
		@Body() dto: AdminUserChangeStatusRequestDto,
		@CurrentUser() admin: User,
	) {
		await this.adminUserService.changeUserStatus(id, dto.status, admin.id);
		return null;
	}

	@Patch(':id/plan')
	@AuditLog({
		action: 'Assign membership plan',
		resourceType: 'User',
		resourceIdParam: 'id',
	})
	@ApiOperation({ summary: '[ADMIN] Assign a membership plan to a user' })
	@Responser.handle('Assign membership plan')
	@HttpCode(HttpStatus.OK)
	async assignPlan(
		@Param('id', ParseUUIDPipe) id: string,
		@Body() dto: AdminUserAssignPlanRequestDto,
	) {
		const expiresAt = dto.expiresAt ? new Date(dto.expiresAt) : null;
		return this.membershipService.assignPlan(id, dto.plan, expiresAt);
	}

	@Post(':id/verify')
	@AuditLog({
		action: 'Verify user account',
		resourceType: 'User',
		resourceIdParam: 'id',
	})
	@ApiOperation({
		summary: '[ADMIN] Approve or reject account verification (TASK 37)',
	})
	@Responser.handle('Verify user account')
	@HttpCode(HttpStatus.OK)
	async verifyUser(
		@Param('id', ParseUUIDPipe) id: string,
		@Body() dto: AdminUserVerifyRequestDto,
		@CurrentUser() admin: User,
	) {
		await this.adminUserService.verifyUser(id, admin.id, dto);
		return null;
	}

	@Delete(':id')
	@AuditLog({
		action: 'Soft delete user',
		resourceType: 'User',
		resourceIdParam: 'id',
	})
	@ApiOperation({ summary: '[ADMIN] Soft delete a user' })
	@Responser.handle('Delete user')
	@HttpCode(HttpStatus.OK)
	async softDelete(
		@Param('id', ParseUUIDPipe) id: string,
		@CurrentUser() admin: User,
	) {
		await this.adminUserService.softDeleteUser(id, admin.id);
		return null;
	}
}
