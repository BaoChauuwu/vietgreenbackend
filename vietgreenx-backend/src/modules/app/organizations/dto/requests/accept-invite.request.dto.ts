import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class AcceptInviteRequestDto {
	@ApiProperty({
		description: 'The secure token received in the invitation link',
		example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
	})
	@IsNotEmpty()
	@IsString()
	token: string;
}
