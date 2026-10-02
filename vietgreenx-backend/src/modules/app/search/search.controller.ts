import {
	Controller,
	Get,
	HttpCode,
	HttpStatus,
	Query,
	UseGuards,
} from '@nestjs/common';
import { SearchService } from './search.service';
import {
	ApiBearerAuth,
	ApiOperation,
	ApiResponse,
	ApiTags,
} from '@nestjs/swagger';
import { AppAuthGuard } from '../app-auth/app-auth.guard';
import { CurrentUser } from '@app/common/decorators/current-user.decorator';
import { Responser } from '@app/common/decorators/responser.decorator';
import { toDto } from '@app/common/transformers/dto.transformer';
import { User } from '@app/database/typeorm/entities';
import { GlobalSearchQueryDto } from './dto/requests/global-search-query.request.dto';
import {
	GlobalSearchOverviewResponseDto,
	SearchUsersResponseDto,
	SearchPostsResponseDto,
	SearchProductsResponseDto,
} from './dto/responses/global-search-response.dto';
import { SearchType } from '@app/common/enums/search-type.enum';

@ApiTags('App / Search')
@Controller('app/search')
export class SearchController {
	constructor(private readonly searchService: SearchService) {}

	@Get()
	@UseGuards(AppAuthGuard)
	@ApiBearerAuth()
	@ApiOperation({
		summary: '[AUTH] Global search across users, posts, and products',
	})
	@HttpCode(HttpStatus.OK)
	@Responser.handle('Search completed successfully')
	@ApiResponse({ status: 200, description: 'Success' })
	async search(
		@CurrentUser() user: User,
		@Query() query: GlobalSearchQueryDto,
	) {
		const result = await this.searchService.globalSearch(user.id, query);

		if (!query.type) {
			return toDto(GlobalSearchOverviewResponseDto, result);
		}

		if (query.type === SearchType.USERS) {
			return toDto(SearchUsersResponseDto, result);
		}

		if (query.type === SearchType.POSTS) {
			return toDto(SearchPostsResponseDto, result);
		}

		if (query.type === SearchType.PRODUCTS) {
			return toDto(SearchProductsResponseDto, result);
		}
	}
}
