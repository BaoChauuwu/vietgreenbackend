import {
	Body,
	Controller,
	HttpCode,
	HttpStatus,
	Post,
	Get,
	Patch,
	Param,
	Query,
	UseGuards,
	ParseUUIDPipe,
} from '@nestjs/common';
import {
	ApiBearerAuth,
	ApiOperation,
	ApiResponse,
	ApiTags,
} from '@nestjs/swagger';
import { AppAuthGuard } from '../app-auth/app-auth.guard';
import { BatchService } from './batch.service';
import { Responser } from '@app/common/decorators/responser.decorator';
import { BatchResponseDto } from './dto/responses/batch.response.dto';
import { User } from '@app/database/typeorm/entities/identity/user.entity';
import { CurrentUser } from '@app/common/decorators/current-user.decorator';
import { CreateBatchRequestDto } from './dto/requests/create-batch.request.dto';
import { UpdateBatchRequestDto } from './dto/requests/update-batch.request.dto';
import { GenerateBatchQrRequestDto } from './dto/requests/generate-batch-qr.request.dto';
import { GenerateBatchQrResponseDto } from './dto/responses/generate-batch-qr.response.dto';
import {
	toDto,
	toPaginateDtos,
} from '@app/common/transformers/dto.transformer';
import { ListBatchesRequestDto } from './dto/requests/list-batches.request.dto';

@ApiTags('App / Batches')
@Controller('app/batches')
export class BatchController {
	constructor(private readonly batchService: BatchService) {}

	@Post()
	@UseGuards(AppAuthGuard)
	@ApiBearerAuth()
	@HttpCode(HttpStatus.CREATED)
	@ApiOperation({ summary: '[AUTH] Create a new batch' })
	@Responser.handle('Create batch')
	@ApiResponse({ status: 201, type: BatchResponseDto })
	async create(@CurrentUser() user: User, @Body() dto: CreateBatchRequestDto) {
		const result = await this.batchService.create(user, dto);
		return toDto(BatchResponseDto, result);
	}

	@Get()
	@UseGuards(AppAuthGuard)
	@ApiBearerAuth()
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: '[AUTH] Get list of batches' })
	@Responser.handle('Get batches')
	@ApiResponse({ status: 200, type: BatchResponseDto })
	async findAll(
		@CurrentUser() user: User,
		@Query() query: ListBatchesRequestDto,
	) {
		const result = await this.batchService.findAll(user, query);
		return toPaginateDtos(BatchResponseDto, result);
	}

	@Get(':id')
	@UseGuards(AppAuthGuard)
	@ApiBearerAuth()
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: '[AUTH] Get batch details' })
	@Responser.handle('Get batch detail')
	@ApiResponse({ status: 200, type: BatchResponseDto })
	async findOne(
		@CurrentUser() user: User,
		@Param('id', ParseUUIDPipe) id: string,
	) {
		const result = await this.batchService.findOne(user, id);
		return toDto(BatchResponseDto, result);
	}

	@Patch(':id')
	@UseGuards(AppAuthGuard)
	@ApiBearerAuth()
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: '[AUTH] Update batch fields' })
	@Responser.handle('Update batch')
	@ApiResponse({ status: 200, type: BatchResponseDto })
	async update(
		@CurrentUser() user: User,
		@Param('id', ParseUUIDPipe) id: string,
		@Body() dto: UpdateBatchRequestDto,
	) {
		const result = await this.batchService.update(user, id, dto);
		return toDto(BatchResponseDto, result);
	}

	@Post(':id/qr/generate')
	@UseGuards(AppAuthGuard)
	@ApiBearerAuth()
	@HttpCode(HttpStatus.CREATED)
	@ApiOperation({ summary: '[AUTH] Generate QR codes for a batch' })
	@Responser.handle('Generate QR codes')
	@ApiResponse({ status: 201, type: GenerateBatchQrResponseDto })
	async generateQrCodes(
		@CurrentUser() user: User,
		@Param('id', ParseUUIDPipe) id: string,
		@Body() dto: GenerateBatchQrRequestDto,
	) {
		const result = await this.batchService.generateQrCodes(user, id, dto);
		return toDto(GenerateBatchQrResponseDto, result);
	}
}
