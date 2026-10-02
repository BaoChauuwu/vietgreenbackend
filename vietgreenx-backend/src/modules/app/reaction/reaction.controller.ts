import {
	Body,
	Controller,
	Delete,
	Get,
	HttpCode,
	HttpStatus,
	Post,
	Query,
	UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ReactionService } from './reaction.service';
import { AppAuthGuard } from '@app/modules/app/app-auth/app-auth.guard';
import { CurrentUser } from '@app/common/decorators/current-user.decorator';
import { User } from '@app/database/typeorm/entities/identity/user.entity';
import { Responser } from '@app/common/decorators/responser.decorator';
import { ReactionRequestDto } from './dto/requests/reaction.request.dto';
import { ReactionResponseDto } from './dto/responses/reaction.response.dto';
import { UnReactionRequestDto } from './dto/requests/un-reaction.request.dto';
import { ListReactionsRequestDto } from './dto/requests/list-reactions.request.dto';
import { ReactionUserItemDto } from './dto/responses/reaction-list.response.dto';
import {
	toDto,
	toPaginateDtos,
} from '@app/common/transformers/dto.transformer';

@ApiTags('App / Reactions')
@Controller('app/reactions')
@ApiBearerAuth()
@UseGuards(AppAuthGuard)
export class ReactionController {
	constructor(private readonly reactionService: ReactionService) {}

	@Get()
	@ApiOperation({
		summary:
			'[AUTH] List users who reacted to a target, filterable by reaction type',
	})
	@Responser.handle('List reactions')
	@HttpCode(HttpStatus.OK)
	async listReactions(@Query() query: ListReactionsRequestDto) {
		const result = await this.reactionService.listReactions(
			query.targetType,
			query.targetId,
			query.reaction,
			query.page,
			query.limit,
		);
		return toPaginateDtos(ReactionUserItemDto, result);
	}

	@Post()
	@ApiOperation({ summary: '[AUTH] React to a target (Post/Comment)' })
	@Responser.handle('React')
	@HttpCode(HttpStatus.CREATED)
	async react(@CurrentUser() user: User, @Body() dto: ReactionRequestDto) {
		const reaction = await this.reactionService.react(user, dto);
		return toDto(ReactionResponseDto, reaction);
	}

	@Delete()
	@ApiOperation({ summary: '[AUTH] Remove reaction' })
	@Responser.handle('Remove reaction')
	@HttpCode(HttpStatus.OK)
	async unreact(
		@CurrentUser() user: User,
		@Query() query: UnReactionRequestDto,
	) {
		await this.reactionService.unreact(user, query.targetId, query.targetType);
		return null;
	}
}
