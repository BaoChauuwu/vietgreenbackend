import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { StatsService } from './stats.service';
import { Responser } from '@app/common/decorators/responser.decorator';
import { PublicStatsResponseDto } from './dto/responses/public-stats.response.dto';
import { toDto } from '@app/common/transformers/dto.transformer';

@ApiTags('App / Stats')
@Controller('app/stats')
export class StatsController {
	constructor(private readonly statsService: StatsService) {}

	@Get()
	@ApiOperation({ summary: '[PUBLIC] Get public system statistics' })
	@Responser.handle('Get system statistics')
	@HttpCode(HttpStatus.OK)
	async getStats() {
		const result = await this.statsService.getPublicStats();
		return toDto(PublicStatsResponseDto, result);
	}
}
