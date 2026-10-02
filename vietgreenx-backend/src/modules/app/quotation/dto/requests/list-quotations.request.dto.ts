import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { QuotationStatus } from '@app/common/enums/quotation-status.enum';
import { PaginationDto } from '@app/common/dtos/paginationDto';

export enum QuotationDirection {
	SENT = 'sent',
	RECEIVED = 'received',
}

export class ListQuotationsRequestDto extends PaginationDto {
	@ApiPropertyOptional({
		enum: QuotationDirection,
		description: 'Filter by sent or received',
	})
	@IsOptional()
	@IsEnum(QuotationDirection)
	direction?: QuotationDirection;

	@ApiPropertyOptional({
		enum: QuotationStatus,
		description: 'Filter by status',
	})
	@IsOptional()
	@IsEnum(QuotationStatus)
	status?: QuotationStatus;
}
