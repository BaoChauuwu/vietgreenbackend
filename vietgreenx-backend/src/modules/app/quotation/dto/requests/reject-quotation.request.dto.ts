import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class RejectQuotationRequestDto {
	@ApiPropertyOptional({
		description: 'Reason for rejection',
		example: 'Giá chưa phù hợp',
	})
	@IsOptional()
	@IsString()
	@MaxLength(500)
	rejectionNote?: string;
}
