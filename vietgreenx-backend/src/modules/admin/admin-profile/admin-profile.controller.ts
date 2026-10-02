import {
	Controller,
	Get,
	HttpCode,
	HttpStatus,
	UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminProfileService } from './admin-profile.service';
import { Responser } from '@app/common/decorators/responser.decorator';
import { AuthGuard } from '@app/common/guards/auth.guard';
import { RolesGuard } from '@app/common/guards/roles.guard';
import { Roles } from '@app/common/decorators/roles.decorator';
import { UserRole } from '@app/common/enums/user-role.enum';
import { CurrentUser } from '@app/common/decorators/current-user.decorator';
import { User } from '@app/database/typeorm/entities/identity/user.entity';
import { toDto } from '@app/common/transformers/dto.transformer';
import { AdminProfileResponseDto } from './dto/responses/admin-profile.response.dto';

@ApiTags('Admin / Profile')
@Controller('admin')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminProfileController {
	constructor(private readonly adminProfileService: AdminProfileService) {}

	@Get('profile')
	@ApiOperation({ summary: '[ADMIN] Get profile' })
	@Responser.handle('Get profile')
	@HttpCode(HttpStatus.OK)
	async getProfile(@CurrentUser() user: User) {
		const data = await this.adminProfileService.findProfile(user);
		return toDto(AdminProfileResponseDto, data);
	}
}
