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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@app/common/guards/auth.guard';
import { RolesGuard } from '@app/common/guards/roles.guard';
import { Roles } from '@app/common/decorators/roles.decorator';
import { UserRole } from '@app/common/enums/user-role.enum';
import { Responser } from '@app/common/decorators/responser.decorator';
import { toDto, toDtos } from '@app/common/transformers/dto.transformer';
import { AdminMembershipService } from './admin-membership.service';
import { CreateMembershipTierRequestDto } from './dto/requests/create-membership-tier.request.dto';
import { UpdateMembershipTierRequestDto } from './dto/requests/update-membership-tier.request.dto';
import { MembershipTierResponseDto } from './dto/responses/membership-tier.response.dto';

@ApiTags('Admin / Membership')
@Controller('admin/membership/tiers')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminMembershipController {
	constructor(
		private readonly adminMembershipService: AdminMembershipService,
	) {}

	@Get()
	@ApiOperation({ summary: '[ADMIN] List all membership tiers' })
	@Responser.handle('List membership tiers')
	@HttpCode(HttpStatus.OK)
	async findAll() {
		const tiers = await this.adminMembershipService.findAll();
		return toDtos(MembershipTierResponseDto, tiers);
	}

	@Get(':id')
	@ApiOperation({ summary: '[ADMIN] Get membership tier details' })
	@Responser.handle('Get membership tier')
	@HttpCode(HttpStatus.OK)
	async findOne(@Param('id', ParseUUIDPipe) id: string) {
		const tier = await this.adminMembershipService.findOne(id);
		return toDto(MembershipTierResponseDto, tier);
	}

	@Post()
	@ApiOperation({ summary: '[ADMIN] Create a membership tier' })
	@Responser.handle('Create membership tier')
	@HttpCode(HttpStatus.CREATED)
	async create(@Body() dto: CreateMembershipTierRequestDto) {
		const tier = await this.adminMembershipService.create(dto);
		return toDto(MembershipTierResponseDto, tier);
	}

	@Patch(':id')
	@ApiOperation({ summary: '[ADMIN] Update a membership tier' })
	@Responser.handle('Update membership tier')
	@HttpCode(HttpStatus.OK)
	async update(
		@Param('id', ParseUUIDPipe) id: string,
		@Body() dto: UpdateMembershipTierRequestDto,
	) {
		const tier = await this.adminMembershipService.update(id, dto);
		return toDto(MembershipTierResponseDto, tier);
	}
}
