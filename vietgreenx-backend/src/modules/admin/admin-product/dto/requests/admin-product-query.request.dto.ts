import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
	IsBoolean,
	IsEnum,
	IsOptional,
	IsString,
	IsUUID,
} from 'class-validator';
import { PaginationDto } from '@app/common/dtos/paginationDto';
import { ProductStatus } from '@app/common/enums/product-status.enum';

export class AdminProductQueryRequestDto extends PaginationDto {
	@ApiPropertyOptional()
	@IsOptional()
	@IsString()
	province?: string;

	@ApiPropertyOptional()
	@IsOptional()
	@IsUUID()
	categoryId?: string;

	@ApiPropertyOptional({ enum: ProductStatus })
	@IsOptional()
	@IsEnum(ProductStatus)
	status?: ProductStatus;

	@ApiPropertyOptional()
	@IsOptional()
	@IsBoolean()
	@Transform(({ value }) => {
		if (value === 'true') return true;
		if (value === 'false') return false;
		return value;
	})
	hasQr?: boolean;
}
