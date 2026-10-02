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
import {
	ApiBearerAuth,
	ApiOperation,
	ApiResponse,
	ApiTags,
} from '@nestjs/swagger';
import { AppAuthGuard } from '@app/modules/app/app-auth/app-auth.guard';
import { CurrentUser } from '@app/common/decorators/current-user.decorator';
import { User } from '@app/database/typeorm/entities/identity/user.entity';
import { CropSeasonService } from './crop-season.service';
import { CreateCropSeasonRequestDto } from './dto/requests/create-crop-season.request.dto';
import { UpdateCropSeasonRequestDto } from './dto/requests/update-crop-season.request.dto';
import { UpdateCropSeasonStatusRequestDto } from './dto/requests/update-crop-season-status.request.dto';
import { ListCropSeasonsRequestDto } from './dto/requests/list-crop-seasons.request.dto';
import { CropSeasonResponseDto } from './dto/responses/crop-season.response.dto';
import {
	toDto,
	toPaginateDtos,
} from '@app/common/transformers/dto.transformer';
import { Responser } from '@app/common/decorators/responser.decorator';

@ApiTags('App / Crop Seasons')
@Controller('app/crop-seasons')
export class CropSeasonController {
	constructor(private readonly cropSeasonService: CropSeasonService) {}

	@Post()
	@UseGuards(AppAuthGuard)
	@ApiBearerAuth()
	@HttpCode(HttpStatus.CREATED)
	@ApiOperation({ summary: '[AUTH] Create a new crop season' })
	@Responser.handle('Create crop season')
	@ApiResponse({ status: 201, type: CropSeasonResponseDto })
	async create(
		@CurrentUser() user: User,
		@Body() dto: CreateCropSeasonRequestDto,
	): Promise<CropSeasonResponseDto> {
		const result = await this.cropSeasonService.create(user, dto);
		return toDto(CropSeasonResponseDto, result);
	}
	@Get()
	@UseGuards(AppAuthGuard)
	@ApiBearerAuth()
	@HttpCode(HttpStatus.OK)
	@ApiOperation({
		summary: '[AUTH] Get list of crop seasons for current user',
	})
	@Responser.handle('Get crop seasons')
	async getCropSeasons(
		@CurrentUser() user: User,
		@Query() query: ListCropSeasonsRequestDto,
	) {
		const result = await this.cropSeasonService.listCropSeasons(user, query);
		return toPaginateDtos(CropSeasonResponseDto, result);
	}
	@Get(':id')
	@UseGuards(AppAuthGuard)
	@ApiBearerAuth()
	@HttpCode(HttpStatus.OK)
	@ApiOperation({
		summary:
			'[AUTH] Get crop season details by ID (only for crop seasons of current user)',
	})
	@Responser.handle('Get crop season details')
	async getCropSeasonDetails(
		@CurrentUser() user: User,
		@Param('id', ParseUUIDPipe) id: string,
	) {
		const result = await this.cropSeasonService.getCropSeasonDetails(user, id);
		return toDto(CropSeasonResponseDto, result);
	}

	@Patch(':id')
	@UseGuards(AppAuthGuard)
	@ApiBearerAuth()
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: '[AUTH] Update crop season' })
	@Responser.handle('Update crop season')
	async update(
		@CurrentUser() user: User,
		@Param('id', ParseUUIDPipe) id: string,
		@Body() dto: UpdateCropSeasonRequestDto,
	) {
		const result = await this.cropSeasonService.update(user, id, dto);
		return toDto(CropSeasonResponseDto, result);
	}

	@Patch(':id/status')
	@UseGuards(AppAuthGuard)
	@ApiBearerAuth()
	@HttpCode(HttpStatus.OK)
	@ApiOperation({
		summary: '[AUTH] Update crop season status (State Machine)',
	})
	@Responser.handle('Update crop season status')
	async updateStatus(
		@CurrentUser() user: User,
		@Param('id', ParseUUIDPipe) id: string,
		@Body() dto: UpdateCropSeasonStatusRequestDto,
	) {
		const result = await this.cropSeasonService.updateStatus(
			user,
			id,
			dto.status,
		);
		return toDto(CropSeasonResponseDto, result);
	}
	@Delete(':id')
	@UseGuards(AppAuthGuard)
	@ApiBearerAuth()
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: '[AUTH] Delete a crop season' })
	@Responser.handle('Delete crop season successfully')
	async deleteCropSeason(@CurrentUser() user: User, @Param('id') id: string) {
		const result = await this.cropSeasonService.deleteCropSeason(user, id);
		return toDto(CropSeasonResponseDto, result);
	}
}
