import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsIn, IsOptional } from 'class-validator';
import { OrgRole } from '@app/common/enums/org-role.enum';

export class UpdateMemberRequestDto {
	@ApiPropertyOptional({
		enum: OrgRole,
		description: 'New role within the organization',
	})
	@IsOptional()
	@IsEnum(OrgRole)
	orgRole?: string;

	@ApiPropertyOptional({
		enum: ['active', 'inactive'],
		description:
			'New status of the member (admin can only set active/inactive)',
	})
	@IsOptional()
	@IsIn(['active', 'inactive'])
	status?: 'active' | 'inactive';
}
