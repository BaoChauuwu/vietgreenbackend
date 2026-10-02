import {
	Controller,
	Get,
	HttpCode,
	HttpStatus,
	Param,
	ParseUUIDPipe,
	Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CategoryService } from './category.service';
import { CategoryResponseDto } from './dto/responses/category.response.dto';
import { Responser } from '@app/common/decorators/responser.decorator';
import { PaginationDto } from '@app/common/dtos/paginationDto';
import {
	toDto,
	toPaginateDtos,
} from '@app/common/transformers/dto.transformer';

@ApiTags('App / Categories')
@Controller('app/categories')
export class CategoryController {
	constructor(private readonly categoryService: CategoryService) {}

	@Get()
	@ApiOperation({ summary: '[PUBLIC] Get all active categories' })
	@Responser.handle('Get all categories')
	@HttpCode(HttpStatus.OK)
	async findAll(@Query() pagination: PaginationDto) {
		const result = await this.categoryService.findAll(pagination);
		return toPaginateDtos(CategoryResponseDto, result);
	}

	@Get(':id')
	@ApiOperation({ summary: '[PUBLIC] Get category detail by ID' })
	@Responser.handle('Get category detail')
	@HttpCode(HttpStatus.OK)
	async findOne(@Param('id', ParseUUIDPipe) id: string) {
		const category = await this.categoryService.findOne(id);
		return toDto(CategoryResponseDto, category);
	}
}
