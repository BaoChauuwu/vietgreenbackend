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
import { ProductReviewService } from './product-review.service';
import {
	ApiBearerAuth,
	ApiOperation,
	ApiResponse,
	ApiTags,
} from '@nestjs/swagger';
import { AppAuthGuard } from '../app-auth/app-auth.guard';
import { CurrentUser } from '@app/common/decorators/current-user.decorator';
import { Responser } from '@app/common/decorators/responser.decorator';
import { toDto, toPaginateDtos } from '@app/common/transformers/dto.transformer';
import { User } from '@app/database/typeorm/entities';
import { CreateProductReviewRequestDto } from './dto/requests/create-product-review.request.dto';
import { ProductReviewResponseDto } from './dto/responses/product-review.response.dto';
import { PaginationDto } from '@app/common/dtos/paginationDto';
import { PaginationResponseDto } from '@app/common/dtos/pagination.response.dto';

@ApiTags('App / Product Reviews')
@Controller('app')
export class ProductReviewController {
	constructor(private readonly productReviewService: ProductReviewService) {}

	@Post('trace/:token/reviews')
	@UseGuards(AppAuthGuard)
	@ApiBearerAuth()
	@ApiOperation({ summary: '[AUTH] Rate product (1-5 stars) after scan' })
	@HttpCode(HttpStatus.CREATED)
	@Responser.handle('Product review submitted successfully')
	@ApiResponse({ status: 201, type: ProductReviewResponseDto })
	async createReview(
		@Param('token', ParseUUIDPipe) token: string,
		@CurrentUser() user: User,
		@Body() dto: CreateProductReviewRequestDto,
	) {
		const result = await this.productReviewService.createReview(
			token,
			user,
			dto,
		);
		return toDto(ProductReviewResponseDto, result);
	}

	@Get('products/:id/reviews')
	@ApiOperation({
		summary: '[PUBLIC] Get public list of reviews for a product',
	})
	@HttpCode(HttpStatus.OK)
	@Responser.handle('Get product reviews successfully')
	@ApiResponse({ status: 200, type: PaginationResponseDto })
	async getReview(
		@Param('id', ParseUUIDPipe) productId: string,
		@Query() query: PaginationDto,
	) {
		const result = await this.productReviewService.getProductReviews(
			productId,
			query,
		);
		return toPaginateDtos(ProductReviewResponseDto, result);
	}
}

