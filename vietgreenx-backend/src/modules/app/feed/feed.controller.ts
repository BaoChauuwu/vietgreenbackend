import {
	Controller,
	Get,
	HttpCode,
	HttpStatus,
	Query,
	UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FeedQueryDto } from './dto/requests/feed.query.dto';
import { FeedResponseDto } from './dto/responses/feed.response.dto';
import { FeedService } from './feed.service';
import { AppAuthGuard } from '@app/modules/app/app-auth/app-auth.guard';
import { Responser } from '@app/common/decorators/responser.decorator';
import { CurrentUser } from '@app/common/decorators/current-user.decorator';
import { toDto } from '@app/common/transformers/dto.transformer';
import { User } from '@app/database/typeorm/entities/identity/user.entity';

@ApiTags('App / Feed')
@ApiBearerAuth()
@UseGuards(AppAuthGuard)
@Controller('app/feed')
export class FeedController {
	constructor(private readonly feedService: FeedService) {}

	@Get()
	@ApiOperation({ summary: '[AUTH] Get post feed' })
	@Responser.handle('Get feed')
	@HttpCode(HttpStatus.OK)
	async getFeed(@CurrentUser() user: User, @Query() query: FeedQueryDto) {
		const result = await this.feedService.getFeed(user.id, query);
		return toDto(FeedResponseDto, result);
	}
}
