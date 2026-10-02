import { IsXor } from '@app/common/decorators/is-xor.decorator';
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

export class FollowRequestDto {
	@ApiProperty({
		example: '019eab62-7e34-767a-b81a-98b10f113440',
		description: 'ID of the user to follow',
	})
	@IsOptional()
	@IsUUID()
	@IsXor(['followeeUserId', 'followeeOrgId'])
	followeeUserId: string;

	@ApiProperty({
		example: '019eab62-7e34-767a-b81a-98b10f113440',
		description: 'ID of the organization to follow',
	})
	@IsOptional()
	@IsUUID()
	followeeOrgId?: string;
}
