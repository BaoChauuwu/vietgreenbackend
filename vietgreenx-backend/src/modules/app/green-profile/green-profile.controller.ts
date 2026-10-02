import {
	Body,
	Controller,
	Get,
	HttpCode,
	HttpStatus,
	Param,
	ParseUUIDPipe,
	Patch,
	Post,
	UseGuards,
} from '@nestjs/common';
import { GreenProfileAccessService } from './green-profile-access.service';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AppAuthGuard } from '../app-auth/app-auth.guard';
import { Responser } from '@app/common/decorators/responser.decorator';
import { CurrentUser } from '@app/common/decorators/current-user.decorator';
import { User } from '@app/database/typeorm/entities/identity/user.entity';
import { toDto } from '@app/common/transformers/dto.transformer';
import { GreenProfileResponseDto } from './dto/responses/green-profile.response.dto';
import { PublicGreenProfileResponseDto } from './dto/responses/public-green-profile.response.dto';
import { RatingBreakdownResponseDto } from './dto/responses/rating-breakdown.response.dto';
import { GreenProfileService } from './green-profile.service';
import { CreateGreenProfileRequestDto } from './dto/requests/create-green-profile.request.dto';
import { UpdateGreenProfileRequestDto } from './dto/requests/update-green-profile.request.dto';

@ApiTags('App / Green Profiles')
@Controller('app/green-profiles')
export class GreenProfileController {
	constructor(
		private readonly greenProfileAccessService: GreenProfileAccessService,
		private readonly greenProfileService: GreenProfileService,
	) {}

	@Get('me')
	@ApiBearerAuth()
	@UseGuards(AppAuthGuard)
	@ApiOperation({ summary: '[AUTH] get current user profile' })
	@HttpCode(HttpStatus.OK)
	@Responser.handle('Get green profile')
	async getMyProfile(@CurrentUser() user: User) {
		const result = await this.greenProfileAccessService.getGreenProfileForUser(
			user.id,
			['certifications', 'products'],
		);
		return toDto(PublicGreenProfileResponseDto, result);
	}

	@Post()
	@ApiBearerAuth()
	@UseGuards(AppAuthGuard)
	@ApiOperation({ summary: '[AUTH] Create green profile' })
	@HttpCode(HttpStatus.CREATED)
	@Responser.handle('Create green profile')
	async createGreenProfile(
		@CurrentUser() user: User,
		@Body() dto: CreateGreenProfileRequestDto,
	) {
		const result = await this.greenProfileService.createGreenProfile(
			user.id,
			dto,
		);
		return toDto(GreenProfileResponseDto, result);
	}

	@Patch('me')
	@ApiBearerAuth()
	@UseGuards(AppAuthGuard)
	@ApiOperation({ summary: '[AUTH] Update personal green profile' })
	@HttpCode(HttpStatus.OK)
	@Responser.handle('Update personal green profile')
	async updateMyProfile(
		@CurrentUser() user: User,
		@Body() dto: UpdateGreenProfileRequestDto,
	) {
		const result = await this.greenProfileService.updateGreenProfile(
			user.id,
			dto,
		);
		return toDto(GreenProfileResponseDto, result);
	}

	@Get('organization/:organizationId')
	@ApiBearerAuth()
	@UseGuards(AppAuthGuard)
	@ApiOperation({
		summary:
			'[AUTH] Get organization green profile by orgId (incl. unpublished)',
	})
	@HttpCode(HttpStatus.OK)
	@Responser.handle('Get organization green profile')
	async getOrgProfile(
		@CurrentUser() user: User,
		@Param('organizationId', ParseUUIDPipe) organizationId: string,
	) {
		const result = await this.greenProfileAccessService.getGreenProfileForOrg(
			user.id,
			organizationId,
			['certifications', 'products'],
		);
		return toDto(GreenProfileResponseDto, result);
	}

	@Patch('organization/:organizationId')
	@ApiBearerAuth()
	@UseGuards(AppAuthGuard)
	@ApiOperation({ summary: '[AUTH] Update organization green profile' })
	@HttpCode(HttpStatus.OK)
	@Responser.handle('Update organization green profile')
	async updateOrgProfile(
		@CurrentUser() user: User,
		@Param('organizationId', ParseUUIDPipe) organizationId: string,
		@Body() dto: UpdateGreenProfileRequestDto,
	) {
		const result = await this.greenProfileService.updateGreenProfile(
			user.id,
			dto,
			organizationId,
		);
		return toDto(GreenProfileResponseDto, result);
	}

	@Get(':slug')
	@ApiOperation({ summary: '[PUBLIC] Get public green profile by slug' })
	@HttpCode(HttpStatus.OK)
	@Responser.handle('Get public green profile by slug')
	async getPublicProfileBySlug(@Param('slug') slug: string) {
		const result = await this.greenProfileService.getPublicProfileBySlug(slug);
		return toDto(PublicGreenProfileResponseDto, result);
	}

	@Get(':slug/rating-breakdown')
	@ApiOperation({
		summary: '[PUBLIC] Get rating breakdown (1–5 stars) for a green profile',
	})
	@HttpCode(HttpStatus.OK)
	@Responser.handle('Get rating breakdown')
	async getRatingBreakdown(@Param('slug') slug: string) {
		const result = await this.greenProfileService.getRatingBreakdown(slug);
		return toDto(RatingBreakdownResponseDto, result);
	}

	@Patch('me/publish')
	@ApiBearerAuth()
	@UseGuards(AppAuthGuard)
	@ApiOperation({
		summary: '[AUTH] Toggle publish status of personal green profile',
	})
	@HttpCode(HttpStatus.OK)
	@Responser.handle('Toggle publish status')
	async toggleMyPublishStatus(@CurrentUser() user: User) {
		const result = await this.greenProfileService.togglePublishStatus(user.id);
		return toDto(GreenProfileResponseDto, result);
	}

	@Patch('organization/:organizationId/publish')
	@ApiBearerAuth()
	@UseGuards(AppAuthGuard)
	@ApiOperation({
		summary: '[AUTH] Toggle publish status of organization green profile',
	})
	@HttpCode(HttpStatus.OK)
	@Responser.handle('Toggle organization publish status')
	async toggleOrgPublishStatus(
		@CurrentUser() user: User,
		@Param('organizationId', ParseUUIDPipe) organizationId: string,
	) {
		const result = await this.greenProfileService.togglePublishStatus(
			user.id,
			organizationId,
		);
		return toDto(GreenProfileResponseDto, result);
	}
}
