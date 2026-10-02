import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { OrgRole } from '@app/common/enums/org-role.enum';
import { OrganizationResponseDto } from './organization.response.dto';

export class MyOrganizationResponseDto {
	@ApiProperty({
		description: 'Role of the current user in this organization',
		enum: OrgRole,
	})
	@Expose()
	orgRole: OrgRole;

	@ApiProperty({ type: () => OrganizationResponseDto })
	@Expose()
	@Type(() => OrganizationResponseDto)
	organization: OrganizationResponseDto;
}
