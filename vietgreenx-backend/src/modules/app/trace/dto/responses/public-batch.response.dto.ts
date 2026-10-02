import { OmitType } from '@nestjs/swagger';
import { BatchResponseDto } from '../../../batch/dto/responses/batch.response.dto';

export class PublicBatchResponseDto extends OmitType(BatchResponseDto, [
	'createdBy',
	'cropSeasonId',
	'greenProfileId',
	'cropSeason',
	'productionLogs',
] as const) {}
