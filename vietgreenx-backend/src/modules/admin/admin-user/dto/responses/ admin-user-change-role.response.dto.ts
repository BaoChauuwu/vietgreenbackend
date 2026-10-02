import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class AdminUserChangeRoleResponseDto {
	@ApiProperty({
		example: 'Change user role successfully',
	})
	@IsOptional()
	@IsString()
	message: string;
}
