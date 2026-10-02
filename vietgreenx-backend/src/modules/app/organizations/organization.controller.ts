import {
	Body,
	Controller,
	Get,
	Param,
	ParseUUIDPipe,
	Post,
	Patch,
	Delete,
	Query,
	UseGuards,
	HttpCode,
	HttpStatus,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { OrganizationService } from './organization.service';
import { CreateOrganizationRequestDto } from './dto/requests/create-organization.request.dto';
import { SubmitVerificationRequestDto } from './dto/requests/submit-verification.request.dto';
import { UpdateOrganizationRequestDto } from './dto/requests/update-organization.request.dto';
import { AddMemberRequestDto } from './dto/requests/add-member.request.dto';
import { UpdateMemberRequestDto } from './dto/requests/update-member.request.dto';
import { AcceptInviteRequestDto } from './dto/requests/accept-invite.request.dto';
import { PaginationDto } from '@app/common/dtos/paginationDto';
import { AppAuthGuard } from '@app/modules/app/app-auth/app-auth.guard';
import { Responser } from '@app/common/decorators/responser.decorator';
import { CurrentUser } from '@app/common/decorators/current-user.decorator';
import { User } from '@app/database/typeorm/entities/identity/user.entity';
import {
	toDto,
	toPaginateDtos,
} from '@app/common/transformers/dto.transformer';
import { OrganizationResponseDto } from './dto/responses/organization.response.dto';
import { OrganizationMemberResponseDto } from './dto/responses/organization-member.response.dto';
import { AddMemberResponseDto } from './dto/responses/add-member.response.dto';
import { MyOrganizationResponseDto } from './dto/responses/my-organization.response.dto';

@ApiTags('App / Organizations')
@Controller('app/organizations')
export class OrganizationController {
	constructor(private readonly organizationService: OrganizationService) {}

	@Post()
	@UseGuards(AppAuthGuard)
	@ApiBearerAuth()
	@HttpCode(HttpStatus.CREATED)
	@ApiOperation({ summary: '[AUTH] Create a new organization' })
	@Responser.handle('Create organization')
	async createOrganization(
		@CurrentUser() user: User,
		@Body() dto: CreateOrganizationRequestDto,
	) {
		const result = await this.organizationService.createOrganization(
			user.id,
			dto,
		);
		return toDto(OrganizationResponseDto, result);
	}

	@Get('mine')
	@UseGuards(AppAuthGuard)
	@ApiBearerAuth()
	@ApiOperation({
		summary: '[AUTH] Get organizations the current user belongs to (with role)',
	})
	@Responser.handle('Get my organizations')
	@HttpCode(HttpStatus.OK)
	async findMine(@CurrentUser() user: User) {
		const results = await this.organizationService.findMyOrganizations(user.id);
		return results.map((r) =>
			toDto(MyOrganizationResponseDto, {
				orgRole: r.orgRole,
				organization: r.organization,
			}),
		);
	}

	@Get()
	@ApiOperation({ summary: '[PUBLIC] Get list of active organizations' })
	@Responser.handle('Get organizations')
	@HttpCode(HttpStatus.OK)
	async findAllActive(@Query() paginationDto: PaginationDto) {
		const result = await this.organizationService.findAllActive(paginationDto);
		return toPaginateDtos(OrganizationResponseDto, result);
	}

	@Get(':id')
	@ApiOperation({ summary: '[PUBLIC] Get organization details' })
	@Responser.handle('Get organization details')
	@HttpCode(HttpStatus.OK)
	async findById(@Param('id', ParseUUIDPipe) id: string) {
		const result = await this.organizationService.findById(id);
		return toDto(OrganizationResponseDto, result);
	}

	@Post(':id/verification')
	@UseGuards(AppAuthGuard)
	@ApiBearerAuth()
	@HttpCode(HttpStatus.CREATED)
	@ApiOperation({
		summary: '[ORG_ADMIN] Submit a verification request for an organization',
	})
	@Responser.handle('Submit verification request')
	async submitVerification(
		@CurrentUser() user: User,
		@Param('id', ParseUUIDPipe) id: string,
		@Body() dto: SubmitVerificationRequestDto,
	) {
		await this.organizationService.submitVerification(user.id, id, dto);
		return null;
	}

	@Patch(':id')
	@UseGuards(AppAuthGuard)
	@ApiBearerAuth()
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: '[ORG_ADMIN] Update organization details' })
	@Responser.handle('Update organization')
	async updateOrganization(
		@CurrentUser() user: User,
		@Param('id', ParseUUIDPipe) id: string,
		@Body() dto: UpdateOrganizationRequestDto,
	) {
		const result = await this.organizationService.updateOrganization(
			user.id,
			id,
			dto,
		);
		return toDto(OrganizationResponseDto, result);
	}

	@Delete(':id')
	@UseGuards(AppAuthGuard)
	@ApiBearerAuth()
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: '[ORG_ADMIN] Delete (deactivate) organization' })
	@Responser.handle('Delete organization')
	async deleteOrganization(
		@CurrentUser() user: User,
		@Param('id', ParseUUIDPipe) id: string,
	) {
		await this.organizationService.deleteOrganization(user.id, id);
		return null;
	}

	@Post('invites/accept')
	@UseGuards(AppAuthGuard)
	@ApiBearerAuth()
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: '[AUTH] Accept an organization invitation' })
	@Responser.handle('Accept invitation')
	async acceptInvite(
		@CurrentUser() user: User,
		@Body() dto: AcceptInviteRequestDto,
	) {
		const result = await this.organizationService.acceptInvite(
			user.id,
			dto.token,
		);
		return toDto(OrganizationMemberResponseDto, result);
	}

	@Post('invites/decline')
	@UseGuards(AppAuthGuard)
	@ApiBearerAuth()
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: '[AUTH] Decline an organization invitation' })
	@Responser.handle('Decline invitation')
	async declineInvite(
		@CurrentUser() user: User,
		@Body() dto: AcceptInviteRequestDto,
	) {
		await this.organizationService.declineInvite(user.id, dto.token);
		return null;
	}

	@Post(':id/members')
	@UseGuards(AppAuthGuard)
	@ApiBearerAuth()
	@HttpCode(HttpStatus.CREATED)
	@ApiOperation({ summary: '[ORG_ADMIN] Add a new member to organization' })
	@Responser.handle('Add organization member')
	async addMember(
		@CurrentUser() user: User,
		@Param('id', ParseUUIDPipe) orgId: string,
		@Body() dto: AddMemberRequestDto,
	) {
		const result = await this.organizationService.addMember(
			user.id,
			orgId,
			dto,
		);
		return toDto(AddMemberResponseDto, result);
	}

	@Get(':id/members')
	@ApiOperation({ summary: '[PUBLIC] Get list of active organization members' })
	@Responser.handle('Get organization members')
	@HttpCode(HttpStatus.OK)
	async getMembers(
		@Param('id', ParseUUIDPipe) orgId: string,
		@Query() paginationDto: PaginationDto,
	) {
		const result = await this.organizationService.getMembers(
			orgId,
			paginationDto,
		);
		return toPaginateDtos(OrganizationMemberResponseDto, result);
	}

	@Patch(':id/members/:memberUserId')
	@UseGuards(AppAuthGuard)
	@ApiBearerAuth()
	@HttpCode(HttpStatus.OK)
	@ApiOperation({
		summary: '[ORG_ADMIN] Update organization member role/status',
	})
	@Responser.handle('Update organization member')
	async updateMemberRole(
		@CurrentUser() user: User,
		@Param('id', ParseUUIDPipe) orgId: string,
		@Param('memberUserId', ParseUUIDPipe) memberUserId: string,
		@Body() dto: UpdateMemberRequestDto,
	) {
		const result = await this.organizationService.updateMemberRole(
			user.id,
			orgId,
			memberUserId,
			dto,
		);
		return toDto(OrganizationMemberResponseDto, result);
	}

	@Delete(':id/members/:memberUserId')
	@UseGuards(AppAuthGuard)
	@ApiBearerAuth()
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: '[ORG_ADMIN] Remove a member from organization' })
	@Responser.handle('Remove organization member')
	async removeMember(
		@CurrentUser() user: User,
		@Param('id', ParseUUIDPipe) orgId: string,
		@Param('memberUserId', ParseUUIDPipe) memberUserId: string,
	) {
		await this.organizationService.removeMember(user.id, orgId, memberUserId);
		return null;
	}
}
