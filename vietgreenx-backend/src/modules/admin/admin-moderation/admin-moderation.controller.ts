import {
	Body,
	Controller,
	Get,
	HttpCode,
	HttpStatus,
	Param,
	ParseUUIDPipe,
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
import {
	toDto,
	toPaginateDtos,
} from '@app/common/transformers/dto.transformer';
import { AdminModerationService } from './admin-moderation.service';
import { ModerationQueryRequestDto } from './dto/requests/moderation-query.request.dto';
import { ProcessReportRequestDto } from './dto/requests/process-report.request.dto';
import { ReportResponseDto } from './dto/responses/report.response.dto';

@ApiTags('Admin / Moderation')
@Controller('admin/moderation')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminModerationController {
	constructor(
		private readonly adminModerationService: AdminModerationService,
	) {}

	@Get('reports')
	@ApiOperation({ summary: '[ADMIN] List report queue' })
	@Responser.handle('List reports')
	@HttpCode(HttpStatus.OK)
	async findAll(@Query() query: ModerationQueryRequestDto) {
		const result = await this.adminModerationService.findAll(query);
		return toPaginateDtos(ReportResponseDto, result, { strategy: 'exposeAll' });
	}

	@Get('reports/:id')
	@ApiOperation({ summary: '[ADMIN] Get report detail' })
	@Responser.handle('Get report')
	@HttpCode(HttpStatus.OK)
	async findOne(@Param('id', ParseUUIDPipe) id: string) {
		const report = await this.adminModerationService.findOne(id);
		return toDto(ReportResponseDto, report, { strategy: 'exposeAll' });
	}

	@Post('reports/:id/action')
	@AuditLog({
		action: 'Process report',
		resourceType: 'Report',
		resourceIdParam: 'id',
	})
	@ApiOperation({ summary: '[ADMIN] Process a report action' })
	@Responser.handle('Process report action')
	@HttpCode(HttpStatus.OK)
	async processAction(
		@Param('id', ParseUUIDPipe) id: string,
		@Body() dto: ProcessReportRequestDto,
		@CurrentUser() admin: User,
	) {
		const report = await this.adminModerationService.processAction(
			id,
			dto,
			admin.id,
		);
		return toDto(ReportResponseDto, report, { strategy: 'exposeAll' });
	}
}
