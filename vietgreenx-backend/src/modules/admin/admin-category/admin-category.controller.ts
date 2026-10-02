import {
	Controller,
	Get,
	Post,
	Patch,
	Body,
	Param,
	ParseUUIDPipe,
	UseGuards,
	HttpCode,
	HttpStatus,
	Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@app/common/guards/auth.guard';
import { RolesGuard } from '@app/common/guards/roles.guard';
import { Roles } from '@app/common/decorators/roles.decorator';
import { UserRole } from '@app/common/enums/user-role.enum';
import { AdminCategoryService } from './admin-category.service';
import { Responser } from '@app/common/decorators/responser.decorator';
import { CreateCategoryRequestDto } from './dto/requests/create-category.request.dto';
import { UpdateCategoryRequestDto } from './dto/requests/update-category.request.dto';
import { PaginationDto } from '@app/common/dtos/paginationDto';
import {
	toDto,
	toPaginateDtos,
} from '@app/common/transformers/dto.transformer';
import { AdminCategoryResponseDto } from './dto/responses/admin-category.response.dto';

@ApiTags('Admin / Categories')
@Controller('admin/categories')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminCategoryController {
	constructor(private readonly adminCategoryService: AdminCategoryService) {}

	@Post()
	@ApiOperation({ summary: '[ADMIN] Create a new category' })
	@Responser.handle('Create category')
	@HttpCode(HttpStatus.CREATED)
	async create(@Body() createCategoryDto: CreateCategoryRequestDto) {
		const category = await this.adminCategoryService.create(createCategoryDto);
		return toDto(AdminCategoryResponseDto, category);
	}

	@Get()
	@ApiOperation({ summary: '[ADMIN] Get all categories' })
	@Responser.handle('Get all categories')
	@HttpCode(HttpStatus.OK)
	async findAll(@Query() pagination: PaginationDto) {
		const result = await this.adminCategoryService.findAll(pagination);
		return toPaginateDtos(AdminCategoryResponseDto, result);
	}

	@Get(':id')
	@ApiOperation({ summary: '[ADMIN] Get category details' })
	@Responser.handle('Get category details')
	@HttpCode(HttpStatus.OK)
	async findOne(@Param('id', ParseUUIDPipe) id: string) {
		const category = await this.adminCategoryService.findOne(id);
		return toDto(AdminCategoryResponseDto, category);
	}

	@Patch(':id')
	@ApiOperation({ summary: '[ADMIN] Update a category' })
	@Responser.handle('Update category')
	@HttpCode(HttpStatus.OK)
	async update(
		@Param('id', ParseUUIDPipe) id: string,
		@Body() updateCategoryDto: UpdateCategoryRequestDto,
	) {
		const category = await this.adminCategoryService.update(
			id,
			updateCategoryDto,
		);
		return toDto(AdminCategoryResponseDto, category);
	}

	@Patch(':id/hide')
	@ApiOperation({
		summary:
			'[ADMIN] Hide a category (set isActive = false) — data is preserved',
	})
	@Responser.handle('Hide category')
	@HttpCode(HttpStatus.OK)
	async hide(@Param('id', ParseUUIDPipe) id: string) {
		const category = await this.adminCategoryService.hide(id);
		return toDto(AdminCategoryResponseDto, category);
	}
}
