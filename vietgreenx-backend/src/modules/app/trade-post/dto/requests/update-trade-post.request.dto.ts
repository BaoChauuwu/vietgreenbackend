import { ApiPropertyOptional } from '@nestjs/swagger';
import {
	IsDateString,
	IsEnum,
	IsInt,
	IsNumber,
	IsOptional,
	IsString,
	MaxLength,
	Min,
} from 'class-validator';
import { TradeStatus } from '@app/common/enums/trade-status.enum';

export class UpdateTradePostDto {
	@ApiPropertyOptional()
	@IsOptional()
	@IsString()
	title?: string;

	@ApiPropertyOptional()
	@IsOptional()
	@IsString()
	@MaxLength(2000)
	description?: string;

	@ApiPropertyOptional()
	@IsOptional()
	@IsNumber()
	@Min(1)
	priceReference?: number;

	@ApiPropertyOptional()
	@IsOptional()
	@IsString()
	province?: string;

	@ApiPropertyOptional({
		example: 1,
		description: 'Province code từ provinces.open-api.vn',
	})
	@IsOptional()
	@IsInt()
	@Min(1)
	provinceCode?: number;

	@ApiPropertyOptional({ example: 10 })
	@IsOptional()
	@IsInt()
	@Min(1)
	districtCode?: number;

	@ApiPropertyOptional({ example: 250 })
	@IsOptional()
	@IsInt()
	@Min(1)
	wardCode?: number;

	@ApiPropertyOptional()
	@IsOptional()
	@IsNumber()
	@Min(0.01)
	quantity?: number;

	@ApiPropertyOptional()
	@IsOptional()
	@IsString()
	quantityUnit?: string;

	@ApiPropertyOptional()
	@IsOptional()
	@IsDateString()
	deadline?: string;

	@ApiPropertyOptional({ enum: [TradeStatus.CLOSED] })
	@IsOptional()
	@IsEnum([TradeStatus.CLOSED])
	status?: TradeStatus.CLOSED;
}
