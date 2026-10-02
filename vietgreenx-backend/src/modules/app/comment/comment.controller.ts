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
import { Responser } from '@app/common/decorators/responser.decorator';
import { toDto } from '@app/common/transformers/dto.transformer';
import { AppAuthGuard } from '@app/modules/app/app-auth/app-auth.guard';
import { CurrentUser } from '@app/common/decorators/current-user.decorator';
import { User } from '@app/database/typeorm/entities';
import { CommentService } from './comment.service';
import { CreateCommentRequestDto } from './dto/requests/create-comment.request.dto';
import { UpdateCommentRequestDto } from './dto/requests/update-comment.request.dto';
import { GetCommentsQueryRequestDto } from './dto/requests/get-comments-query.request.dto';
import { CommentResponseDto } from './dto/responses/comment.response.dto';
import { CommentsResponseDto } from './dto/responses/comments.response.dto';

@ApiTags('App / Comments')
@ApiBearerAuth()
@Controller('app/comments')
@UseGuards(AppAuthGuard)
export class CommentController {
	constructor(private readonly commentService: CommentService) {}

	@Post()
	@HttpCode(HttpStatus.CREATED)
	@ApiOperation({ summary: '[AUTH] Create comment on post' })
	@Responser.handle('Comment created successfully')
	async create(
		@CurrentUser() user: User,
		@Body() dto: CreateCommentRequestDto,
	) {
		const comment = await this.commentService.create(dto, user);
		return toDto(CommentResponseDto, comment);
	}

	@Get()
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: '[AUTH] List comments for post' })
	@Responser.handle('Comments retrieved successfully')
	async findAll(
		@CurrentUser() user: User,
		@Query() query: GetCommentsQueryRequestDto,
	) {
		const comments = await this.commentService.findAll(query, user.id);
		return toDto(CommentsResponseDto, {
			items: comments.data,
			nextCursor: comments.nextCursor ?? null,
			hasNext: comments.hasNext,
			limit: comments.limit,
		});
	}

	@Patch(':id')
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: '[AUTH] Update own comment' })
	@Responser.handle('Comment updated successfully')
	async update(
		@CurrentUser() user: User,
		@Param('id', ParseUUIDPipe) id: string,
		@Body() dto: UpdateCommentRequestDto,
	) {
		const comment = await this.commentService.update(id, dto, user);
		return toDto(CommentResponseDto, comment);
	}

	@Delete(':id')
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: '[AUTH] Delete own comment' })
	@Responser.handle('Comment deleted successfully')
	async remove(
		@CurrentUser() user: User,
		@Param('id', ParseUUIDPipe) id: string,
	) {
		await this.commentService.remove(id, user);
		return null;
	}
}
