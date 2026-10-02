import { OmitType } from '@nestjs/swagger';
import { ProductResponseDto } from '../../../product/dto/responses/product.response.dto';

export class PublicProductResponseDto extends OmitType(ProductResponseDto, [
	'ownerUserId',
	'organizationId',
	'greenProfileId',
	'isForMarketplace',
	'hasQr',
	'viewCount',
] as const) {}
