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
import { QuotationService } from './quotation.service';
import { AppAuthGuard } from '@app/modules/app/app-auth/app-auth.guard';
import { CurrentUser } from '@app/common/decorators/current-user.decorator';
import { User } from '@app/database/typeorm/entities/identity/user.entity';
import { Responser } from '@app/common/decorators/responser.decorator';
import {
	toDto,
	toPaginateDtos,
} from '@app/common/transformers/dto.transformer';
import { CreateQuotationRequestDto } from './dto/requests/create-quotation.request.dto';
import { RejectQuotationRequestDto } from './dto/requests/reject-quotation.request.dto';
import { ListQuotationsRequestDto } from './dto/requests/list-quotations.request.dto';
import { QuotationResponseDto } from './dto/responses/quotation.response.dto';

@ApiTags('App / Quotations')
@Controller('app/quotations')
@ApiBearerAuth()
@UseGuards(AppAuthGuard)
export class QuotationController {
	constructor(private readonly quotationService: QuotationService) {}

	@Post()
	@ApiOperation({ summary: '[AUTH] Send a quotation to a seller' })
	@Responser.handle('Create quotation')
	@HttpCode(HttpStatus.CREATED)
	async createQuotation(
		@Body() dto: CreateQuotationRequestDto,
		@CurrentUser() user: User,
	) {
		const result = await this.quotationService.createQuotation(user.id, dto);
		return toDto(QuotationResponseDto, result, { strategy: 'exposeAll' });
	}

	@Get()
	@ApiOperation({ summary: '[AUTH] List my quotations (sent and/or received)' })
	@Responser.handle('List quotations')
	@HttpCode(HttpStatus.OK)
	async findAll(
		@Query() query: ListQuotationsRequestDto,
		@CurrentUser() user: User,
	) {
		const result = await this.quotationService.findAll(user.id, query);
		return toPaginateDtos(QuotationResponseDto, result, {
			strategy: 'exposeAll',
		});
	}

	@Get(':id')
	@ApiOperation({ summary: '[AUTH] Get quotation detail' })
	@Responser.handle('Get quotation')
	@HttpCode(HttpStatus.OK)
	async findOne(
		@Param('id', ParseUUIDPipe) id: string,
		@CurrentUser() user: User,
	) {
		const result = await this.quotationService.findOne(id, user.id);
		return toDto(QuotationResponseDto, result, { strategy: 'exposeAll' });
	}

	@Patch(':id/accept')
	@ApiOperation({ summary: '[AUTH] Accept a quotation (receiver only)' })
	@Responser.handle('Accept quotation')
	@HttpCode(HttpStatus.OK)
	async acceptQuotation(
		@Param('id', ParseUUIDPipe) id: string,
		@CurrentUser() user: User,
	) {
		const result = await this.quotationService.acceptQuotation(id, user.id);
		return toDto(QuotationResponseDto, result, { strategy: 'exposeAll' });
	}

	@Patch(':id/reject')
	@ApiOperation({ summary: '[AUTH] Reject a quotation (receiver only)' })
	@Responser.handle('Reject quotation')
	@HttpCode(HttpStatus.OK)
	async rejectQuotation(
		@Param('id', ParseUUIDPipe) id: string,
		@Body() dto: RejectQuotationRequestDto,
		@CurrentUser() user: User,
	) {
		const result = await this.quotationService.rejectQuotation(
			id,
			user.id,
			dto,
		);
		return toDto(QuotationResponseDto, result, { strategy: 'exposeAll' });
	}

	@Patch(':id/withdraw')
	@ApiOperation({
		summary: '[AUTH] Withdraw a pending quotation (sender only)',
	})
	@Responser.handle('Withdraw quotation')
	@HttpCode(HttpStatus.OK)
	async withdrawQuotation(
		@Param('id', ParseUUIDPipe) id: string,
		@CurrentUser() user: User,
	) {
		await this.quotationService.withdrawQuotation(id, user.id);
		return null;
	}
}
