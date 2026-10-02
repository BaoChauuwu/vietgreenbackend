import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { CreateProductRequestDto } from './create-product.request.dto';
import { IsEnum, IsOptional } from 'class-validator';
import { ProductStatus } from '@app/common/enums/product-status.enum';

export class UpdateProductRequestDto extends PartialType(
	CreateProductRequestDto,
) {
	@ApiPropertyOptional({
		description: 'The status of the product',
		enum: ProductStatus,
	})
	@IsOptional()
	@IsEnum(ProductStatus)
	status?: ProductStatus;
}
