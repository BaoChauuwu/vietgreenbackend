import {
	Body,
	Controller,
	Get,
	HttpCode,
	HttpStatus,
	Param,
	ParseUUIDPipe,
	Patch,
	Query,
	UseGuards,
} from '@nestjs/common';
import {
	ApiBearerAuth,
	ApiOperation,
	ApiParam,
	ApiTags,
} from '@nestjs/swagger';
import { UserProfileService } from './user-profile.service';
import { ProfileResponseDto } from './dto/responses/profile.response.dto';
import { AppAuthGuard } from '@app/modules/app/app-auth/app-auth.guard';
import { Responser } from '@app/common/decorators/responser.decorator';
import { HttpForbiddenError } from '@app/common/errors/forbidden.error';
import { ErrorCode } from '@app/common/errors/error-code';
import { UpdateProfileRequestDto } from './dto/requests/update-profile.request.dto';
import { User } from '@app/database/typeorm/entities/identity/user.entity';
import { CurrentUser } from '@app/common/decorators/current-user.decorator';
import { toDto, toDtos } from '@app/common/transformers/dto.transformer';
import { UserSearchQueryDto } from './dto/requests/user-search.query.dto';
import { UserSearchResponseDto } from './dto/responses/user-search.response.dto';
import { UserSearchItemResponseDto } from './dto/responses/user-search-item.response.dto';
import { TransactionHistoryQueryDto } from './dto/requests/transaction-history.query.dto';

@ApiTags('App / Users')
@ApiBearerAuth()
@UseGuards(AppAuthGuard)
@Controller('app/users')
export class UserProfileController {
	constructor(private readonly userProfileService: UserProfileService) {}

	@Get('search')
	@ApiOperation({
		summary:
			'[AUTH] Search users by username or display name (for block, etc.)',
	})
	@Responser.handle('Search users')
	@HttpCode(HttpStatus.OK)
	async searchUsers(
		@CurrentUser() viewer: User,
		@Query() query: UserSearchQueryDto,
	) {
		const result = await this.userProfileService.searchUsers(
			viewer.id,
			query.q,
			query.limit ?? 10,
		);
		return toDto(UserSearchResponseDto, {
			items: toDtos(UserSearchItemResponseDto, result.items),
		});
	}

	@Get(':id/profile')
	@ApiOperation({ summary: '[AUTH] Get user profile' })
	@ApiParam({ name: 'id', description: 'User ID (UUID)' })
	@Responser.handle('Get user profile')
	@HttpCode(HttpStatus.OK)
	async getProfile(
		@Param('id', ParseUUIDPipe) userId: string,
		@CurrentUser() viewer: User,
	) {
		const profile = await this.userProfileService.getProfile(userId, viewer.id);
		return toDto(ProfileResponseDto, profile);
	}

	@Get(':id/transaction-history')
	@ApiOperation({
		summary:
			'[AUTH] Get transaction history (quotations sent/received, no price shown)',
	})
	@ApiParam({ name: 'id', description: 'User ID (UUID)' })
	@Responser.handle('Get transaction history')
	@HttpCode(HttpStatus.OK)
	async getTransactionHistory(
		@Param('id', ParseUUIDPipe) userId: string,
		@CurrentUser() viewer: User,
		@Query() query: TransactionHistoryQueryDto,
	) {
		if (viewer.id !== userId) {
			throw new HttpForbiddenError(ErrorCode.CANNOT_UPDATE_OTHERS_PROFILE);
		}
		return this.userProfileService.getTransactionHistory(
			userId,
			query.page ?? 1,
			query.limit ?? 20,
		);
	}

	@Patch(':id/profile')
	@ApiOperation({
		summary:
			'[AUTH] Update user profile (set avatarMediaId after media upload completes)',
	})
	@ApiParam({ name: 'id', description: 'User ID (UUID)' })
	@Responser.handle('Update user profile')
	@HttpCode(HttpStatus.OK)
	async updateProfile(
		@Param('id', ParseUUIDPipe) userId: string,
		@Body() dto: UpdateProfileRequestDto,
		@CurrentUser() user: User,
	) {
		if (user.id !== userId) {
			throw new HttpForbiddenError(ErrorCode.CANNOT_UPDATE_OTHERS_PROFILE);
		}

		const profile = await this.userProfileService.updateProfile(userId, dto);
		return toDto(ProfileResponseDto, profile);
	}
}
