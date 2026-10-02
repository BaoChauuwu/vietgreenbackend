import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { MemberUserResponseDto } from './member-user.response.dto';

export class OrganizationMemberResponseDto {
	@ApiProperty()
	@Expose()
	id: string;

	@ApiProperty()
	@Expose()
	organizationId: string;

	@ApiProperty()
	@Expose()
	userId: string;

	@ApiProperty()
	@Expose()
	orgRole: string;

	@ApiProperty()
	@Expose()
	status: string;

	@ApiProperty()
	@Expose()
	joinedAt: Date;

	@ApiProperty({ type: () => MemberUserResponseDto })
	@Expose()
	@Type(() => MemberUserResponseDto)
	user: MemberUserResponseDto;
}
