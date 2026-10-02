import { OmitType } from '@nestjs/swagger';
import { ProductionLogResponseDto } from '../../../production-log/dto/responses/production-log.response.dto';

export class PublicProductionLogResponseDto extends OmitType(
	ProductionLogResponseDto,
	['cropSeasonId', 'createdBy'] as const,
) {}
