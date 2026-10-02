import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsUUID } from 'class-validator';
import { OrgRole } from '@app/common/enums/org-role.enum';

export class AddMemberRequestDto {
	@ApiProperty({ description: 'ID of the user to add to the organization' })
	@IsNotEmpty()
	@IsUUID()
	userId: string;

	@ApiProperty({
		enum: OrgRole,
		description: 'Role within the organization',
		default: OrgRole.MEMBER,
	})
	@IsNotEmpty()
	@IsEnum(OrgRole)
	orgRole: string;
}
