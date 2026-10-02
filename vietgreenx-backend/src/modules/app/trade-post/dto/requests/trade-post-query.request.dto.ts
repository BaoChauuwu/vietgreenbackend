import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
	IsEnum,
	IsNumber,
	IsOptional,
	IsString,
	IsUUID,
	Min,
} from 'class-validator';
import { PaginationDto } from '@app/common/dtos/paginationDto';
import { TradeType } from '@app/common/enums/trade-type.enum';

export enum TradePostSort {
	NEWEST = 'newest',
	HIGHEST_QUANTITY = 'highest_quantity',
	LOWEST_PRICE = 'lowest_price',
}

export class TradePostQueryDto extends PaginationDto {
	@ApiPropertyOptional({ enum: TradeType })
	@IsOptional()
	@IsEnum(TradeType)
	tradeType?: TradeType;

	@ApiPropertyOptional()
	@IsOptional()
	@IsString()
	province?: string;

	@ApiPropertyOptional()
	@IsOptional()
	@IsUUID()
	categoryId?: string;

	@ApiPropertyOptional()
	@IsOptional()
	@IsNumber()
	@Min(0)
	@Transform(({ value }) => (value !== undefined ? Number(value) : undefined))
	minQuantity?: number;

	@ApiPropertyOptional()
	@IsOptional()
	@IsNumber()
	@Min(0)
	@Transform(({ value }) => (value !== undefined ? Number(value) : undefined))
	maxQuantity?: number;

	@ApiPropertyOptional({ enum: TradePostSort, default: TradePostSort.NEWEST })
	@IsOptional()
	@IsEnum(TradePostSort)
	sort?: TradePostSort = TradePostSort.NEWEST;
}
