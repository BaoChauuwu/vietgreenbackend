import {
	Body,
	Controller,
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
import { AuthGuard } from '@app/common/guards/auth.guard';
import { RolesGuard } from '@app/common/guards/roles.guard';
import { Roles } from '@app/common/decorators/roles.decorator';
import { UserRole } from '@app/common/enums/user-role.enum';
import { Responser } from '@app/common/decorators/responser.decorator';
import { CurrentUser } from '@app/common/decorators/current-user.decorator';
import { User } from '@app/database/typeorm/entities/identity/user.entity';
import {
	toDto,
	toPaginateDtos,
} from '@app/common/transformers/dto.transformer';
import { AdminCertificationService } from './admin-certification.service';
import { ListCertificationsQueryDto } from './dto/requests/list-certifications-query.request.dto';
import { ReviewCertificationRequestDto } from './dto/requests/review-certification.request.dto';
import { AdminCertificationResponseDto } from './dto/responses/admin-certification.response.dto';

@ApiTags('Admin / Certifications')
@Controller('admin/certifications')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminCertificationController {
	constructor(
		private readonly adminCertificationService: AdminCertificationService,
	) {}

	@Get()
	@ApiOperation({ summary: '[ADMIN] List certifications (default: pending)' })
	@Responser.handle('List certifications')
	@HttpCode(HttpStatus.OK)
	async listCertifications(@Query() query: ListCertificationsQueryDto) {
		const result =
			await this.adminCertificationService.listCertifications(query);
		return toPaginateDtos(AdminCertificationResponseDto, result);
	}

	@Post(':id/review')
	@ApiOperation({ summary: '[ADMIN] Approve or reject a certificate' })
	@Responser.handle('Review certification')
	@HttpCode(HttpStatus.OK)
	async reviewCertification(
		@Param('id', ParseUUIDPipe) id: string,
		@Body() dto: ReviewCertificationRequestDto,
		@CurrentUser() admin: User,
	) {
		const result = await this.adminCertificationService.reviewCertification(
			id,
			dto,
			admin.id,
		);
		return toDto(AdminCertificationResponseDto, result);
	}
}
