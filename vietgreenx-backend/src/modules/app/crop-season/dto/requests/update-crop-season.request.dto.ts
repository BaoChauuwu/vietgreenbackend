import { PartialType } from '@nestjs/swagger';
import { CreateCropSeasonRequestDto } from './create-crop-season.request.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional } from 'class-validator';

export class UpdateCropSeasonRequestDto extends PartialType(
	CreateCropSeasonRequestDto,
) {
	@ApiPropertyOptional({ description: 'Actual Harvest Date (YYYY-MM-DD)' })
	@IsOptional()
	@IsDateString()
	actualHarvestDate?: string;
}
