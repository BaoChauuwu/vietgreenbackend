import { PaginationDto } from '@app/common/dtos/paginationDto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { SeasonStatus } from '@app/common/enums/season-status.enum';

export class ListCropSeasonsRequestDto extends PaginationDto {
	@ApiPropertyOptional({
		description: 'Filter crop seasons by status',
		enum: SeasonStatus,
	})
	@IsOptional()
	@IsEnum(SeasonStatus)
	status?: SeasonStatus;
}
