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
import { ProductService } from './product.service';
import {
	ApiBearerAuth,
	ApiOperation,
	ApiResponse,
	ApiTags,
} from '@nestjs/swagger';
import { AppAuthGuard } from '../app-auth/app-auth.guard';
import { Responser } from '@app/common/decorators/responser.decorator';
import { CreateProductRequestDto } from './dto/requests/create-product.request.dto';
import { UpdateProductRequestDto } from './dto/requests/update-product.request.dto';
import { User } from '@app/database/typeorm/entities/identity/user.entity';
import { CurrentUser } from '@app/common/decorators/current-user.decorator';
import { ProductResponseDto } from './dto/responses/product.response.dto';
import {
	toDto,
	toPaginateDtos,
} from '@app/common/transformers/dto.transformer';
import { PaginationDto } from '@app/common/dtos/paginationDto';
import { PaginationResponseDto } from '@app/common/dtos/pagination.response.dto';

@ApiTags('App / Products')
@Controller('app/products')
export class ProductController {
	constructor(private readonly productService: ProductService) {}
	@Post()
	@UseGuards(AppAuthGuard)
	@ApiBearerAuth()
	@ApiOperation({ summary: '[AUTH] Create a new product' })
	@HttpCode(HttpStatus.CREATED)
	@Responser.handle('Create Product')
	@ApiResponse({ status: 201, type: ProductResponseDto })
	async create(
		@CurrentUser() user: User,
		@Body() dto: CreateProductRequestDto,
	): Promise<ProductResponseDto> {
		const result = await this.productService.createProduct(user, dto);
		return toDto(ProductResponseDto, result);
	}

	@Get()
	@UseGuards(AppAuthGuard)
	@ApiBearerAuth()
	@ApiOperation({ summary: '[AUTH] Get all products' })
	@HttpCode(HttpStatus.OK)
	@Responser.handle('Get All Products')
	@ApiResponse({ status: 200, type: PaginationResponseDto })
	async getAll(@CurrentUser() user: User, @Query() query: PaginationDto) {
		const result = await this.productService.getAllProducts(user, query);
		return toPaginateDtos(ProductResponseDto, result);
	}

	@Get(':id')
	@UseGuards(AppAuthGuard)
	@ApiBearerAuth()
	@ApiOperation({ summary: '[AUTH] Get product detail' })
	@HttpCode(HttpStatus.OK)
	@Responser.handle('Get Product Detail')
	@ApiResponse({ status: 200, type: ProductResponseDto })
	async getDetail(
		@CurrentUser() user: User,
		@Param('id', ParseUUIDPipe) id: string,
	) {
		const result = await this.productService.getProductDetail(user, id);
		return toDto(ProductResponseDto, result);
	}

	@Patch(':id')
	@UseGuards(AppAuthGuard)
	@ApiBearerAuth()
	@ApiOperation({ summary: '[AUTH] Update product (including status)' })
	@HttpCode(HttpStatus.OK)
	@Responser.handle('Update Product')
	@ApiResponse({ status: 200, type: ProductResponseDto })
	async update(
		@CurrentUser() user: User,
		@Param('id', ParseUUIDPipe) id: string,
		@Body() dto: UpdateProductRequestDto,
	) {
		const result = await this.productService.updateProduct(user, id, dto);
		return toDto(ProductResponseDto, result);
	}
}
