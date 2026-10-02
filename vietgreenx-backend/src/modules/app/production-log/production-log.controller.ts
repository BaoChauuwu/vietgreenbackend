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
import {
	ApiBearerAuth,
	ApiOperation,
	ApiResponse,
	ApiTags,
} from '@nestjs/swagger';
import { ProductionLogService } from './production-log.service';
import { AppAuthGuard } from '../app-auth/app-auth.guard';
import { CurrentUser } from '@app/common/decorators/current-user.decorator';
import { User } from '@app/database/typeorm/entities/identity/user.entity';
import { CreateProductionLogRequestDto } from './dto/requests/create-production-log.request.dto';
import { CreateProductionLogNoteRequestDto } from './dto/requests/create-production-log-note.request.dto';
import { ProductionLogResponseDto } from './dto/responses/production-log.response.dto';
import { ProductionLogNoteResponseDto } from './dto/responses/production-log-note.response.dto';
import { QrMilestoneSummaryResponseDto } from './dto/responses/qr-milestone-summary.response.dto';
import { Responser } from '@app/common/decorators/responser.decorator';
import {
	toDto,
	toPaginateDtos,
} from '@app/common/transformers/dto.transformer';
import { PaginationDto } from '@app/common/dtos/paginationDto';

@ApiTags('App / Production Logs')
@Controller('app')
export class ProductionLogController {
	constructor(private readonly productionLogService: ProductionLogService) {}

	@Post('crop-seasons/:seasonId/production-logs')
	@UseGuards(AppAuthGuard)
	@ApiBearerAuth()
	@HttpCode(HttpStatus.CREATED)
	@ApiOperation({
		summary: '[AUTH] Create a new production log for a crop season',
	})
	@Responser.handle('Create production log')
	@ApiResponse({ status: 201, type: ProductionLogResponseDto })
	async createProductionLog(
		@CurrentUser() user: User,
		@Param('seasonId', ParseUUIDPipe) seasonId: string,
		@Body() dto: CreateProductionLogRequestDto,
	): Promise<ProductionLogResponseDto> {
		const result = await this.productionLogService.createProductionLog(
			user,
			seasonId,
			dto,
		);
		return toDto(ProductionLogResponseDto, result);
	}

	@Get('crop-seasons/:seasonId/production-logs')
	@UseGuards(AppAuthGuard)
	@HttpCode(HttpStatus.OK)
	@ApiBearerAuth()
	@ApiOperation({
		summary: '[AUTH] Get all production logs of a specific crop season',
	})
	@Responser.handle('Get production logs')
	@ApiResponse({ status: 200, type: [ProductionLogResponseDto] })
	async getProductionLogs(
		@CurrentUser() user: User,
		@Param('seasonId', ParseUUIDPipe) seasonId: string,
		@Query() query: PaginationDto,
	) {
		const logs = await this.productionLogService.getProductionLogs(
			user,
			seasonId,
			query,
		);
		return toPaginateDtos(ProductionLogResponseDto, logs);
	}

	@Get('production-logs/:id')
	@UseGuards(AppAuthGuard)
	@HttpCode(HttpStatus.OK)
	@ApiBearerAuth()
	@ApiOperation({
		summary: '[AUTH] Get production log details by ID',
	})
	@Responser.handle('Get production log details')
	@ApiResponse({ status: 200, type: ProductionLogResponseDto })
	async getProductionLogDetails(
		@CurrentUser() user: User,
		@Param('id', ParseUUIDPipe) id: string,
	) {
		const result = await this.productionLogService.getProductionLogDetails(
			user,
			id,
		);
		return toDto(ProductionLogResponseDto, result);
	}

	@Post('production-logs/:id/notes')
	@UseGuards(AppAuthGuard)
	@ApiBearerAuth()
	@HttpCode(HttpStatus.CREATED)
	@ApiOperation({
		summary: '[AUTH] Append a new note to an existing production log',
	})
	@Responser.handle('Append note to production log')
	@ApiResponse({ status: 201, type: ProductionLogNoteResponseDto })
	async addNoteToLog(
		@CurrentUser() user: User,
		@Param('id', ParseUUIDPipe) id: string,
		@Body() dto: CreateProductionLogNoteRequestDto,
	) {
		const result = await this.productionLogService.addNoteToLog(user, id, dto);
		return toDto(ProductionLogNoteResponseDto, result);
	}

	@Get('crop-seasons/:seasonId/qr-summary')
	@HttpCode(HttpStatus.OK)
	@ApiOperation({
		summary: '[PUBLIC] Get 5-milestone production log summary for QR code',
	})
	@Responser.handle('Get QR 5-milestone summary')
	@ApiResponse({ status: 200, type: [QrMilestoneSummaryResponseDto] })
	async getQrSummary(@Param('seasonId', ParseUUIDPipe) seasonId: string) {
		const result = await this.productionLogService.getQrSummary(seasonId);
		return toDto(QrMilestoneSummaryResponseDto, result);
	}
}
