import {
	Controller,
	Get,
	HttpCode,
	HttpStatus,
	UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AppAuthGuard } from '@app/modules/app/app-auth/app-auth.guard';
import { CurrentUser } from '@app/common/decorators/current-user.decorator';
import { User } from '@app/database/typeorm/entities/identity/user.entity';
import { Responser } from '@app/common/decorators/responser.decorator';
import { MembershipService } from './membership.service';
import { toDto, toDtos } from '@app/common/transformers/dto.transformer';
import { MembershipPlanResponseDto } from './dto/responses/membership-plan.response.dto';
import { MembershipTierPublicResponseDto } from './dto/responses/membership-tier-public.response.dto';

@ApiTags('App / Membership')
@ApiBearerAuth()
@Controller('app/membership')
@UseGuards(AppAuthGuard)
export class MembershipController {
	constructor(private readonly membershipService: MembershipService) {}

	@Get('me')
	@ApiOperation({ summary: '[AUTH] Get current user membership plan status' })
	@Responser.handle('Get membership plan')
	@HttpCode(HttpStatus.OK)
	async getMyPlan(@CurrentUser() user: User) {
		const result = await this.membershipService.getMyPlan(user);
		return toDto(MembershipPlanResponseDto, result, { strategy: 'exposeAll' });
	}

	@Get('tiers')
	@ApiOperation({
		summary: '[AUTH] List all active membership tiers (pricing page)',
	})
	@Responser.handle('List membership tiers')
	@HttpCode(HttpStatus.OK)
	async listTiers() {
		const tiers = await this.membershipService.listActiveTiers();
		return toDtos(MembershipTierPublicResponseDto, tiers);
	}
}
