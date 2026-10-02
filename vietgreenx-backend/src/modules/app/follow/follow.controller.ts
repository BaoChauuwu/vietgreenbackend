import {
	Body,
	Controller,
	HttpCode,
	HttpStatus,
	Post,
	Get,
	Param,
	Query,
	ParseUUIDPipe,
	UseGuards,
	Delete,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FollowService } from './follow.service';
import { AppAuthGuard } from '@app/modules/app/app-auth/app-auth.guard';
import { CurrentUser } from '@app/common/decorators/current-user.decorator';
import { User } from '@app/database/typeorm/entities/identity/user.entity';
import { FollowRequestDto } from './dto/requests/follow.request.dto';
import { FollowQueryRequestDto } from './dto/requests/follow-query.request.dto';
import { toDto, toDtos } from '@app/common/transformers/dto.transformer';
import { FollowResponseDto } from './dto/responses/follow.response.dto';
import {
	FollowItemResponseDto,
	FollowListResponseDto,
} from './dto/responses/follow-list.response.dto';
import { Responser } from '@app/common/decorators/responser.decorator';

@ApiTags('App / Follows')
@ApiBearerAuth()
@UseGuards(AppAuthGuard)
@Controller('app')
export class FollowController {
	constructor(private readonly followService: FollowService) {}

	@Post('follows')
	@ApiOperation({
		summary: '[AUTH] Follow a user or organization',
	})
	@Responser.handle('Follow target')
	@HttpCode(HttpStatus.CREATED)
	async followUser(@CurrentUser() user: User, @Body() dto: FollowRequestDto) {
		const result = await this.followService.followUser(user.id, dto);
		return toDto(FollowResponseDto, result);
	}

	@Get('users/:id/followers')
	@ApiOperation({
		summary: '[AUTH] Get list of followers for a user',
	})
	@Responser.handle('Get followers')
	@HttpCode(HttpStatus.OK)
	async getFollowers(
		@CurrentUser() user: User,
		@Param('id', ParseUUIDPipe) id: string,
		@Query() query: FollowQueryRequestDto,
	) {
		const result = await this.followService.getFollower(user.id, id, query);
		return toDto(FollowListResponseDto, {
			...result,
			items: toDtos(FollowItemResponseDto, result.items),
		});
	}

	@Get('users/:id/following')
	@ApiOperation({
		summary: '[AUTH] Get list of entities followed by a user',
	})
	@Responser.handle('Get following')
	@HttpCode(HttpStatus.OK)
	async getFollowing(
		@CurrentUser() user: User,
		@Param('id', ParseUUIDPipe) id: string,
		@Query() query: FollowQueryRequestDto,
	) {
		const result = await this.followService.getFollowing(user.id, id, query);
		return toDto(FollowListResponseDto, {
			...result,
			items: toDtos(FollowItemResponseDto, result.items),
		});
	}

	@Delete('follows/:targetId')
	@ApiOperation({
		summary: '[AUTH] Unfollow a user or organization',
	})
	@Responser.handle('Unfollow target')
	@HttpCode(HttpStatus.OK)
	async unFollow(
		@CurrentUser() user: User,
		@Param('targetId', ParseUUIDPipe) targetId: string,
	) {
		const result = await this.followService.unFollow(user.id, targetId);
		return toDto(FollowResponseDto, result);
	}

	@Post('follows/:followId/accept')
	@ApiOperation({
		summary: '[AUTH] Accept follow request',
	})
	@Responser.handle('Accept follow request')
	@HttpCode(HttpStatus.OK)
	async acceptFollowRequest(
		@CurrentUser() user: User,
		@Param('followId', ParseUUIDPipe) followId: string,
	) {
		const result = await this.followService.acceptFollowRequest(
			user.id,
			followId,
		);
		return toDto(FollowResponseDto, result);
	}
}
