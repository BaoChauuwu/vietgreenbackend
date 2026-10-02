import {
	Controller,
	DefaultValuePipe,
	Get,
	HttpCode,
	HttpStatus,
	Param,
	ParseIntPipe,
	ParseUUIDPipe,
	Patch,
	Query,
	UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@app/common/guards/auth.guard';
import { RolesGuard } from '@app/common/guards/roles.guard';
import { Roles } from '@app/common/decorators/roles.decorator';
import { UserRole } from '@app/common/enums/user-role.enum';
import { Responser } from '@app/common/decorators/responser.decorator';
import { AuditLog } from '@app/common/decorators/audit-log.decorator';
import {
	toDto,
	toDtos,
	toPaginateDtos,
} from '@app/common/transformers/dto.transformer';
import { AdminProductService } from './admin-product.service';
import { AdminProductQueryRequestDto } from './dto/requests/admin-product-query.request.dto';
import { AdminProductListResponseDto } from './dto/responses/admin-product-list.response.dto';
import { AdminProductDetailResponseDto } from './dto/responses/admin-product-detail.response.dto';
import { AuditLogResponseDto } from './dto/responses/audit-log.response.dto';

@ApiTags('Admin / Products')
@Controller('admin/products')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminProductController {
	constructor(private readonly adminProductService: AdminProductService) {}

	@Get()
	@ApiOperation({ summary: '[ADMIN] List all products' })
	@Responser.handle('List products')
	@HttpCode(HttpStatus.OK)
	async findAll(@Query() query: AdminProductQueryRequestDto) {
		const result = await this.adminProductService.findAll(query);
		return toPaginateDtos(AdminProductListResponseDto, result, {
			strategy: 'exposeAll',
		});
	}

	@Get(':id')
	@ApiOperation({ summary: '[ADMIN] Get product detail' })
	@Responser.handle('Get product')
	@HttpCode(HttpStatus.OK)
	async findOne(@Param('id', ParseUUIDPipe) id: string) {
		const product = await this.adminProductService.findOne(id);
		return toDto(AdminProductDetailResponseDto, product, {
			strategy: 'exposeAll',
		});
	}

	@Get(':id/audit-log')
	@ApiOperation({ summary: '[ADMIN] Get audit log for a product' })
	@Responser.handle('Get product audit log')
	@HttpCode(HttpStatus.OK)
	async getAuditLog(
		@Param('id', ParseUUIDPipe) id: string,
		@Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
		@Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
	) {
		const result = await this.adminProductService.getAuditLog(id, page, limit);
		return {
			...result,
			items: result.items.map(
				(item) =>
					toDtos(AuditLogResponseDto, [item], { strategy: 'exposeAll' })[0],
			),
		};
	}

	@Patch(':id/hide')
	@AuditLog({
		action: 'Hide product',
		resourceType: 'Product',
		resourceIdParam: 'id',
	})
	@ApiOperation({ summary: '[ADMIN] Hide product (archive)' })
	@Responser.handle('Hide product')
	@HttpCode(HttpStatus.OK)
	async hide(@Param('id', ParseUUIDPipe) id: string) {
		const product = await this.adminProductService.hide(id);
		return toDto(AdminProductDetailResponseDto, product, {
			strategy: 'exposeAll',
		});
	}
}
