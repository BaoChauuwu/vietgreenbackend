import {
	Controller,
	Get,
	HttpCode,
	HttpStatus,
	UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AppAuthGuard } from '../app-auth/app-auth.guard';
import { QrQuotaService } from './qr-quota.service';
import { CurrentUser } from '@app/common/decorators/current-user.decorator';
import { User } from '@app/database/typeorm/entities/identity/user.entity';
import { Responser } from '@app/common/decorators/responser.decorator';
import { toDto } from '@app/common/transformers/dto.transformer';
import { QrQuotaSummaryResponseDto } from './dto/responses/qr-quota-summary.response.dto';

@ApiTags('App / QR Quota')
@Controller('app/qr/quota')
@ApiBearerAuth()
@UseGuards(AppAuthGuard)
export class QrQuotaController {
	constructor(private readonly qrQuotaService: QrQuotaService) {}

	@Get()
	@ApiOperation({ summary: '[AUTH] Get remaining QR quota' })
	@Responser.handle('Get QR quota summary')
	@HttpCode(HttpStatus.OK)
	async getQuotaSummary(@CurrentUser() user: User) {
		const result = await this.qrQuotaService.getQuotaSummary(user);
		return toDto(QrQuotaSummaryResponseDto, result);
	}
}
