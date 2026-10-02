import {
	Body,
	Controller,
	Delete,
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
import { SupplierService } from './supplier.service';
import { AppAuthGuard } from '@app/modules/app/app-auth/app-auth.guard';
import { CurrentUser } from '@app/common/decorators/current-user.decorator';
import { User } from '@app/database/typeorm/entities/identity/user.entity';
import { Responser } from '@app/common/decorators/responser.decorator';
import {
	toDto,
	toPaginateDtos,
} from '@app/common/transformers/dto.transformer';
import { CreateSupplierReviewRequestDto } from './dto/requests/create-supplier-review.request.dto';
import { SavedSupplierResponseDto } from './dto/responses/saved-supplier.response.dto';
import {
	SupplierReviewResponseDto,
	SupplierReviewSummaryResponseDto,
} from './dto/responses/supplier-review.response.dto';
import { PaginationDto } from '@app/common/dtos/paginationDto';

@ApiTags('App / Suppliers')
@Controller('app/suppliers')
@ApiBearerAuth()
@UseGuards(AppAuthGuard)
export class SupplierController {
	constructor(private readonly supplierService: SupplierService) {}

	// ─── Saved Suppliers ────────────────────────────────────────────────────────

	@Post('saved/:supplierId')
	@ApiOperation({ summary: '[AUTH] Bookmark / save a supplier' })
	@Responser.handle('Save supplier')
	@HttpCode(HttpStatus.CREATED)
	async saveSupplier(
		@Param('supplierId', ParseUUIDPipe) supplierId: string,
		@CurrentUser() user: User,
	) {
		const result = await this.supplierService.saveSupplier(user.id, supplierId);
		return toDto(SavedSupplierResponseDto, result, { strategy: 'exposeAll' });
	}

	@Delete('saved/:supplierId')
	@ApiOperation({ summary: '[AUTH] Remove a saved supplier' })
	@Responser.handle('Unsave supplier')
	@HttpCode(HttpStatus.OK)
	async unsaveSupplier(
		@Param('supplierId', ParseUUIDPipe) supplierId: string,
		@CurrentUser() user: User,
	) {
		await this.supplierService.unsaveSupplier(user.id, supplierId);
		return null;
	}

	@Get('saved')
	@ApiOperation({ summary: '[AUTH] List my saved suppliers' })
	@Responser.handle('List saved suppliers')
	@HttpCode(HttpStatus.OK)
	async listSavedSuppliers(
		@Query() query: PaginationDto,
		@CurrentUser() user: User,
	) {
		const result = await this.supplierService.listSavedSuppliers(
			user.id,
			query,
		);
		return toPaginateDtos(SavedSupplierResponseDto, result, {
			strategy: 'exposeAll',
		});
	}

	// ─── Reviews ─────────────────────────────────────────────────────────────────

	@Post(':supplierId/reviews')
	@ApiOperation({
		summary: '[AUTH] Leave a review for a supplier (requires completed order)',
	})
	@Responser.handle('Create supplier review')
	@HttpCode(HttpStatus.CREATED)
	async createReview(
		@Param('supplierId', ParseUUIDPipe) supplierId: string,
		@Body() dto: CreateSupplierReviewRequestDto,
		@CurrentUser() user: User,
	) {
		const result = await this.supplierService.createReview(
			user.id,
			supplierId,
			dto,
		);
		return toDto(SupplierReviewResponseDto, result, { strategy: 'exposeAll' });
	}

	@Get(':supplierId/reviews')
	@ApiOperation({ summary: '[AUTH] List reviews for a supplier' })
	@Responser.handle('List supplier reviews')
	@HttpCode(HttpStatus.OK)
	async listReviews(
		@Param('supplierId', ParseUUIDPipe) supplierId: string,
		@Query() query: PaginationDto,
		@CurrentUser() _user: User,
	) {
		const result = await this.supplierService.listReviews(supplierId, query);
		return toPaginateDtos(SupplierReviewResponseDto, result, {
			strategy: 'exposeAll',
		});
	}

	@Get(':supplierId/reviews/summary')
	@ApiOperation({
		summary: '[AUTH] Get review summary (avg rating + count) for a supplier',
	})
	@Responser.handle('Get supplier review summary')
	@HttpCode(HttpStatus.OK)
	async getReviewSummary(
		@Param('supplierId', ParseUUIDPipe) supplierId: string,
		@CurrentUser() _user: User,
	) {
		const result = await this.supplierService.getReviewSummary(supplierId);
		return toDto(SupplierReviewSummaryResponseDto, result, {
			strategy: 'exposeAll',
		});
	}
}
