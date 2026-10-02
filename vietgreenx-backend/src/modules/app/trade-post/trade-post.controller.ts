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
import {
	ApiBearerAuth,
	ApiOperation,
	ApiResponse,
	ApiTags,
} from '@nestjs/swagger';
import { TradePostService } from './trade-post.service';
import { AppAuthGuard } from '../app-auth/app-auth.guard';
import { OptionalAppAuthGuard } from '../app-auth/optional-app-auth.guard';
import { Responser } from '@app/common/decorators/responser.decorator';
import { CurrentUser } from '@app/common/decorators/current-user.decorator';
import { User } from '@app/database/typeorm/entities/identity/user.entity';
import { CreateSellOfferRequestDto } from './dto/requests/create-sell-offer.request.dto';
import { CreateBuyRequestDto } from './dto/requests/create-buy-request.request.dto';
import { UpdateTradePostDto } from './dto/requests/update-trade-post.request.dto';
import { TradePostQueryDto } from './dto/requests/trade-post-query.request.dto';
import { TradePostResponseDto } from './dto/responses/trade-post.response.dto';
import {
	toDto,
	toPaginateDtos,
} from '@app/common/transformers/dto.transformer';
import { PaginationResponseDto } from '@app/common/dtos/pagination.response.dto';

@ApiTags('App / Trade Posts')
@Controller('app/trade-posts')
export class TradePostController {
	constructor(private readonly tradePostService: TradePostService) {}

	@Post()
	@UseGuards(AppAuthGuard)
	@ApiBearerAuth()
	@ApiOperation({ summary: '[AUTH] Create a sell offer' })
	@HttpCode(HttpStatus.CREATED)
	@Responser.handle('Create Sell Offer')
	@ApiResponse({ status: 201, type: TradePostResponseDto })
	async createSellOffer(
		@CurrentUser() user: User,
		@Body() dto: CreateSellOfferRequestDto,
	): Promise<TradePostResponseDto> {
		const result = await this.tradePostService.createSellOffer(user, dto);
		return toDto(TradePostResponseDto, result);
	}

	@Post('buy')
	@UseGuards(AppAuthGuard)
	@ApiBearerAuth()
	@ApiOperation({ summary: '[AUTH] Create a buy request' })
	@HttpCode(HttpStatus.CREATED)
	@Responser.handle('Create Buy Request')
	@ApiResponse({ status: 201, type: TradePostResponseDto })
	async createBuyRequest(
		@CurrentUser() user: User,
		@Body() dto: CreateBuyRequestDto,
	): Promise<TradePostResponseDto> {
		const result = await this.tradePostService.createBuyRequest(user, dto);
		return toDto(TradePostResponseDto, result);
	}

	@Get()
	@UseGuards(OptionalAppAuthGuard)
	@ApiOperation({ summary: '[OPTIONAL AUTH] Get all trade posts' })
	@HttpCode(HttpStatus.OK)
	@Responser.handle('Get All Trade Posts')
	@ApiResponse({ status: 200, type: PaginationResponseDto })
	async findAll(@Query() query: TradePostQueryDto) {
		const result = await this.tradePostService.findAll(query);
		return toPaginateDtos(TradePostResponseDto, result);
	}

	@Get(':id')
	@UseGuards(OptionalAppAuthGuard)
	@ApiOperation({ summary: '[OPTIONAL AUTH] Get trade post detail' })
	@HttpCode(HttpStatus.OK)
	@Responser.handle('Get Trade Post Detail')
	@ApiResponse({ status: 200, type: TradePostResponseDto })
	async findOne(@Param('id', ParseUUIDPipe) id: string) {
		const result = await this.tradePostService.findOne(id);
		return toDto(TradePostResponseDto, result);
	}

	@Patch(':id')
	@UseGuards(AppAuthGuard)
	@ApiBearerAuth()
	@ApiOperation({ summary: '[AUTH] Update trade post' })
	@HttpCode(HttpStatus.OK)
	@Responser.handle('Update Trade Post')
	@ApiResponse({ status: 200, type: TradePostResponseDto })
	async update(
		@CurrentUser() user: User,
		@Param('id', ParseUUIDPipe) id: string,
		@Body() dto: UpdateTradePostDto,
	) {
		const result = await this.tradePostService.update(user, id, dto);
		return toDto(TradePostResponseDto, result);
	}

	@Delete(':id')
	@UseGuards(AppAuthGuard)
	@ApiBearerAuth()
	@ApiOperation({ summary: '[AUTH] Close trade post' })
	@HttpCode(HttpStatus.OK)
	@Responser.handle('Close Trade Post')
	@ApiResponse({ status: 200, type: TradePostResponseDto })
	async close(
		@CurrentUser() user: User,
		@Param('id', ParseUUIDPipe) id: string,
	) {
		const result = await this.tradePostService.close(user, id);
		return toDto(TradePostResponseDto, result);
	}
}
