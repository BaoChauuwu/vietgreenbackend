import {
	Body,
	Controller,
	Delete,
	Get,
	HttpCode,
	HttpStatus,
	Param,
	ParseUUIDPipe,
	Patch,
	Post,
	Query,
	UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PostService } from './post.service';
import { AppAuthGuard } from '@app/modules/app/app-auth/app-auth.guard';
import { OptionalAppAuthGuard } from '@app/modules/app/app-auth/optional-app-auth.guard';
import { CurrentUser } from '@app/common/decorators/current-user.decorator';
import { User } from '@app/database/typeorm/entities/identity/user.entity';
import { Responser } from '@app/common/decorators/responser.decorator';
import { CreatePostRequestDto } from './dto/requests/create-post.request.dto';
import { UpdatePostRequestDto } from './dto/requests/update-post.request.dto';
import { PostResponseDto } from './dto/responses/post.response.dto';
import { HashtagSearchQueryDto } from './dto/requests/hashtag-search.query.dto';
import { HashtagSearchResponseDto } from './dto/responses/hashtag-search.response.dto';
import {
	toDto,
	toPaginateDtos,
} from '@app/common/transformers/dto.transformer';
import { PaginationDto } from '@app/common/dtos/paginationDto';

@ApiTags('App / Posts')
@Controller('app/posts')
export class PostController {
	constructor(private readonly postService: PostService) {}

	@Post()
	@ApiBearerAuth()
	@UseGuards(AppAuthGuard)
	@ApiOperation({ summary: '[AUTH] Create a post' })
	@Responser.handle('Create post')
	@HttpCode(HttpStatus.CREATED)
	async create(@CurrentUser() user: User, @Body() dto: CreatePostRequestDto) {
		const post = await this.postService.create(user, dto);
		return toDto(PostResponseDto, post);
	}

	@Get('me')
	@ApiBearerAuth()
	@UseGuards(AppAuthGuard)
	@ApiOperation({ summary: '[AUTH] List my posts' })
	@Responser.handle('List my posts')
	@HttpCode(HttpStatus.OK)
	async findMine(
		@CurrentUser() user: User,
		@Query() pagination: PaginationDto,
	) {
		const result = await this.postService.findMine(user, pagination);
		return toPaginateDtos(PostResponseDto, result);
	}

	@Get('hashtags')
	@ApiBearerAuth()
	@UseGuards(AppAuthGuard)
	@ApiOperation({ summary: '[AUTH] Search hashtags for composer autocomplete' })
	@Responser.handle('Search hashtags')
	@HttpCode(HttpStatus.OK)
	async searchHashtags(@Query() query: HashtagSearchQueryDto) {
		const result = await this.postService.searchHashtags(
			query.q,
			query.limit ?? 10,
		);
		return toDto(HashtagSearchResponseDto, result);
	}

	@Get(':id')
	@UseGuards(OptionalAppAuthGuard)
	@ApiOperation({
		summary:
			'[PUBLIC] Get post detail (Bearer token optional for private/followers-only posts)',
	})
	@Responser.handle('Get post detail')
	@HttpCode(HttpStatus.OK)
	async findOne(
		@Param('id', ParseUUIDPipe) id: string,
		@CurrentUser() user?: User,
	) {
		const post = await this.postService.findOne(id, user?.id);
		return toDto(PostResponseDto, post);
	}

	@Patch(':id')
	@ApiBearerAuth()
	@UseGuards(AppAuthGuard)
	@ApiOperation({ summary: '[AUTH] Update my post' })
	@Responser.handle('Update post')
	@HttpCode(HttpStatus.OK)
	async update(
		@CurrentUser() user: User,
		@Param('id', ParseUUIDPipe) id: string,
		@Body() dto: UpdatePostRequestDto,
	) {
		const post = await this.postService.update(user, id, dto);
		return toDto(PostResponseDto, post);
	}

	@Delete(':id')
	@ApiBearerAuth()
	@UseGuards(AppAuthGuard)
	@ApiOperation({ summary: '[AUTH] Delete my post' })
	@Responser.handle('Delete post')
	@HttpCode(HttpStatus.OK)
	async remove(
		@CurrentUser() user: User,
		@Param('id', ParseUUIDPipe) id: string,
	) {
		await this.postService.remove(user, id);
		return null;
	}
}
