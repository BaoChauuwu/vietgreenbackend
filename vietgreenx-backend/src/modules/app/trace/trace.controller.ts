import {
	Body,
	Controller,
	Get,
	Headers,
	HttpCode,
	HttpStatus,
	Ip,
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
import { TraceService } from './trace.service';
import { TraceResponseDto } from './dto/responses/trace.response.dto';
import { ReviewResponseDto } from './dto/responses/review.response.dto';
import { CreateReviewRequestDto } from './dto/requests/create-review.request.dto';
import { Responser } from '@app/common/decorators/responser.decorator';
import {
	toDto,
	toPaginateDtos,
} from '@app/common/transformers/dto.transformer';
import { AppAuthGuard } from '@app/modules/app/app-auth/app-auth.guard';
import { CurrentUser } from '@app/common/decorators/current-user.decorator';
import { User } from '@app/database/typeorm/entities/identity/user.entity';
import { PaginationDto } from '@app/common/dtos/paginationDto';

@ApiTags('App / Trace')
@Controller('app/trace')
export class TraceController {
	constructor(private readonly traceService: TraceService) {}

	@Get(':token')
	@ApiOperation({ summary: '[PUBLIC] Get public QR trace details by token' })
	@Responser.handle('Get trace details')
	@HttpCode(HttpStatus.OK)
	@ApiResponse({ status: 200, type: TraceResponseDto })
	async getTraceDetails(
		@Param('token', ParseUUIDPipe) token: string,
		@Ip() ip: string,
		@Headers('user-agent') userAgent?: string,
		@Headers('referer') referrer?: string,
	) {
		const result = await this.traceService.getTraceDetails(
			token,
			ip,
			userAgent,
			referrer,
		);
		return toDto(TraceResponseDto, result);
	}

	@Post(':token/reviews')
	@ApiBearerAuth()
	@UseGuards(AppAuthGuard)
	@ApiOperation({
		summary: '[AUTH] Submit a product review via QR trace token',
	})
	@Responser.handle('Create product review')
	@HttpCode(HttpStatus.CREATED)
	async createReview(
		@Param('token', ParseUUIDPipe) token: string,
		@Body() dto: CreateReviewRequestDto,
		@CurrentUser() user: User,
	) {
		const review = await this.traceService.createReview(token, user.id, dto);
		return toDto(ReviewResponseDto, {
			...review,
			reviewer: {
				id: user.id,
				username: user.username,
				displayName: (user as any).profile?.displayName ?? null,
				avatarUrl: (user as any).profile?.avatarMedia?.cdnUrl ?? null,
			},
		});
	}

	@Get(':token/reviews')
	@ApiOperation({ summary: '[PUBLIC] List product reviews for a trace token' })
	@Responser.handle('Get product reviews')
	@HttpCode(HttpStatus.OK)
	async getReviews(
		@Param('token', ParseUUIDPipe) token: string,
		@Query() query: PaginationDto,
	) {
		const result = await this.traceService.getReviews(token, query);
		return toPaginateDtos(ReviewResponseDto, result, { strategy: 'exposeAll' });
	}
}
