import {
	Body,
	Controller,
	Get,
	HttpCode,
	HttpStatus,
	Param,
	ParseUUIDPipe,
	Patch,
	Query,
	UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminOrganizationService } from './admin-organization.service';
import { Responser } from '@app/common/decorators/responser.decorator';
import { AuthGuard } from '@app/common/guards/auth.guard';
import { RolesGuard } from '@app/common/guards/roles.guard';
import { Roles } from '@app/common/decorators/roles.decorator';
import { UserRole } from '@app/common/enums/user-role.enum';
import { CurrentUser } from '@app/common/decorators/current-user.decorator';
import { User } from '@app/database/typeorm/entities/identity/user.entity';
import { RejectVerificationRequestDto } from './dto/requests/reject-verification.request.dto';
import { PaginationDto } from '@app/common/dtos/paginationDto';
import { toPaginateDtos } from '@app/common/transformers/dto.transformer';
import { AdminVerificationRequestResponseDto } from './dto/responses/admin-verification-request.response.dto';

@ApiTags('Admin / Organizations')
@Controller('admin/organizations')
@UseGuards(AuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth()
export class AdminOrganizationController {
	constructor(
		private readonly adminOrganizationService: AdminOrganizationService,
	) {}

	@Get('verifications')
	@HttpCode(HttpStatus.OK)
	@ApiOperation({
		summary: '[ADMIN] Get list of pending organization verification requests',
	})
	@Responser.handle('Get pending verifications')
	async getPendingVerifications(@Query() paginationDto: PaginationDto) {
		const result =
			await this.adminOrganizationService.getPendingVerifications(
				paginationDto,
			);
		return toPaginateDtos(AdminVerificationRequestResponseDto, result, {
			strategy: 'exposeAll',
		});
	}

	@Patch('verifications/:id/approve')
	@HttpCode(HttpStatus.OK)
	@ApiOperation({
		summary: '[ADMIN] Approve organization verification request',
	})
	@Responser.handle('Approve organization verification')
	async approveVerification(
		@CurrentUser() admin: User,
		@Param('id', ParseUUIDPipe) id: string,
	) {
		await this.adminOrganizationService.approveVerification(id, admin.id);
		return null;
	}

	@Patch('verifications/:id/reject')
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: '[ADMIN] Reject organization verification request' })
	@Responser.handle('Reject organization verification')
	async rejectVerification(
		@CurrentUser() admin: User,
		@Param('id', ParseUUIDPipe) id: string,
		@Body() dto: RejectVerificationRequestDto,
	) {
		await this.adminOrganizationService.rejectVerification(
			id,
			admin.id,
			dto.reason,
		);
		return null;
	}
}
