import {
	Body,
	Controller,
	Get,
	HttpCode,
	HttpStatus,
	Post,
	Query,
	Res,
	UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AppAuthGuard } from '../app-auth/app-auth.guard';
import { CurrentUser } from '@app/common/decorators/current-user.decorator';
import { Responser } from '@app/common/decorators/responser.decorator';
import { User } from '@app/database/typeorm/entities/identity/user.entity';
import { QrService } from './qr.service';
import { ListQrTokensRequestDto } from './dto/requests/list-qr-tokens.request.dto';
import { GenerateQrRequestDto } from './dto/requests/generate-qr.request.dto';
import { ExportQrPdfRequestDto } from './dto/requests/export-pdf.request.dto';
import { QrTokenResponseDto } from './dto/responses/qr-token.response.dto';
import {
	toDto,
	toPaginateDtos,
} from '@app/common/transformers/dto.transformer';

@ApiTags('App / QR')
@Controller('app/qr')
@UseGuards(AppAuthGuard)
@ApiBearerAuth()
export class QrController {
	constructor(private readonly qrService: QrService) {}

	@Get()
	@HttpCode(HttpStatus.OK)
	@ApiOperation({
		summary:
			'[AUTH] List QR tokens (filter by batchId / productId / targetType)',
	})
	@Responser.handle('Get QR tokens')
	async list(
		@CurrentUser() user: User,
		@Query() query: ListQrTokensRequestDto,
	) {
		const result = await this.qrService.listTokens(user, query);
		return toPaginateDtos(QrTokenResponseDto, result);
	}

	@Post('generate')
	@HttpCode(HttpStatus.CREATED)
	@ApiOperation({
		summary: '[AUTH] Generate a QR token for a batch or product',
	})
	@Responser.handle('Generate QR token')
	async generate(
		@CurrentUser() user: User,
		@Body() dto: GenerateQrRequestDto,
	): Promise<QrTokenResponseDto> {
		const result = await this.qrService.generateForBatch(user, dto);
		return toDto(QrTokenResponseDto, result);
	}

	@Post('export-pdf')
	@HttpCode(HttpStatus.OK)
	@ApiOperation({
		summary:
			'[AUTH] Export QR labels as PDF (layout: 4 | 9 | 16 per page, 5×5cm each)',
	})
	async exportPdf(
		@CurrentUser() user: User,
		@Body() dto: ExportQrPdfRequestDto,
		@Res() res: Response,
	): Promise<void> {
		await this.qrService.exportPdf(user, dto, res);
	}
}
