import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query, UseGuards } from '@nestjs/common';
import { ReportService } from './report.service';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AppAuthGuard } from '@app/modules/app/app-auth/app-auth.guard';
import { Responser } from '@app/common/decorators/responser.decorator';
import { CurrentUser } from '@app/common/decorators/current-user.decorator';
import { User } from '@app/database/typeorm/entities';
import { toDto, toPaginateDtos } from '@app/common/transformers/dto.transformer';
import { CreateReportRequestDto } from './dto/requests/create-report.request.dto';
import { CreateReportResponseDto } from './dto/responses/create-report.response.dto';
import { PaginationDto } from '@app/common/dtos/paginationDto';

@ApiTags('App / Reports')
@Controller('app/reports')
@ApiBearerAuth()
@UseGuards(AppAuthGuard)
export class ReportController {
	constructor(private readonly reportService: ReportService) {}

	@Post()
	@ApiOperation({ summary: '[AUTH] Create a new report for post/comment/user/product' })
	@HttpCode(HttpStatus.CREATED)
	@Responser.handle('Report created successfully')
	@ApiResponse({ status: HttpStatus.CREATED, type: CreateReportResponseDto })
	async create(
		@CurrentUser() user: User,
		@Body() dto: CreateReportRequestDto,
	) {
		const report = await this.reportService.createReport(user.id, dto);
		return toDto(CreateReportResponseDto, report);
	}

	@Get('me')
	@ApiOperation({ summary: "[AUTH] List current user's reports" })
	@HttpCode(HttpStatus.OK)
	@Responser.handle('Reports retrieved successfully')
	async getMyReports(
		@CurrentUser() user: User,
		@Query() query: PaginationDto,
	) {
		const result = await this.reportService.getList(user.id, query);
		return toPaginateDtos(CreateReportResponseDto, result);
	}
}
