import {
	Body,
	Controller,
	Delete,
	Get,
	HttpCode,
	HttpStatus,
	Param,
	ParseUUIDPipe,
	Post,
	Query,
	UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { BlockService } from './block.service';
import { AppAuthGuard } from '@app/modules/app/app-auth/app-auth.guard';
import { CurrentUser } from '@app/common/decorators/current-user.decorator';
import { User } from '@app/database/typeorm/entities/identity/user.entity';
import { Responser } from '@app/common/decorators/responser.decorator';
import { CreateBlockRequestDto } from './dto/requests/create-block.request.dto';
import { BlockResponseDto } from './dto/responses/block.response.dto';
import { PaginationDto } from '@app/common/dtos/paginationDto';
import {
	toDto,
	toPaginateDtos,
} from '@app/common/transformers/dto.transformer';

@ApiTags('App / Blocks')
@ApiBearerAuth()
@UseGuards(AppAuthGuard)
@Controller('app/blocks')
export class BlockController {
	constructor(private readonly blockService: BlockService) {}

	@Post()
	@ApiOperation({ summary: '[AUTH] Block a user' })
	@Responser.handle('Block user')
	@HttpCode(HttpStatus.CREATED)
	async blockUser(
		@CurrentUser() user: User,
		@Body() dto: CreateBlockRequestDto,
	) {
		const block = await this.blockService.blockUser(user.id, dto.blockedUserId);
		return toDto(BlockResponseDto, block);
	}

	@Delete(':blockedUserId')
	@ApiOperation({ summary: '[AUTH] Unblock a user' })
	@Responser.handle('Unblock user')
	@HttpCode(HttpStatus.OK)
	async unblockUser(
		@CurrentUser() user: User,
		@Param('blockedUserId', ParseUUIDPipe) blockedUserId: string,
	) {
		await this.blockService.unblockUser(user.id, blockedUserId);
		return null;
	}

	@Get()
	@ApiOperation({ summary: '[AUTH] List users I have blocked' })
	@Responser.handle('List blocked users')
	@HttpCode(HttpStatus.OK)
	async listBlockedUsers(
		@CurrentUser() user: User,
		@Query() paginationDto: PaginationDto,
	) {
		const result = await this.blockService.listBlockedUsers(
			user.id,
			paginationDto,
		);
		return toPaginateDtos(BlockResponseDto, result);
	}
}
