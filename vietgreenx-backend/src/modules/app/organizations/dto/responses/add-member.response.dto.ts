import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { OrganizationMemberResponseDto } from './organization-member.response.dto';

export class AddMemberResponseDto {
	@ApiProperty()
	@Expose()
	inviteLink: string;

	@ApiProperty({ type: () => OrganizationMemberResponseDto })
	@Expose()
	@Type(() => OrganizationMemberResponseDto)
	member: OrganizationMemberResponseDto;
}
