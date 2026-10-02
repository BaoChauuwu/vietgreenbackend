import {
	Controller,
	Post,
	Body,
	UseGuards,
	HttpCode,
	HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ShareService } from './share.service';
import { AppAuthGuard } from '@app/modules/app/app-auth/app-auth.guard';
import { CurrentUser } from '@app/common/decorators/current-user.decorator';
import { User } from '@app/database/typeorm/entities/identity/user.entity';
import { CreateShareRequestDto } from './dto/requests/create-share.request.dto';
import { ShareResponseDto } from './dto/responses/share.response.dto';
import { Responser } from '@app/common/decorators/responser.decorator';
import { toDto } from '@app/common/transformers/dto.transformer';

@ApiTags('App / Shares')
@ApiBearerAuth()
@Controller('app/shares')
@UseGuards(AppAuthGuard)
export class ShareController {
	constructor(private readonly shareService: ShareService) {}

	@Post()
	@ApiOperation({ summary: '[AUTH] Create a share' })
	@Responser.handle('Create share')
	@HttpCode(HttpStatus.CREATED)
	async create(@CurrentUser() user: User, @Body() dto: CreateShareRequestDto) {
		const share = await this.shareService.create(user, dto);
		return toDto(ShareResponseDto, share);
	}
}
