import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RejectVerificationRequestDto {
	@ApiProperty({ description: 'Reason for rejection' })
	@IsNotEmpty()
	@IsString()
	reason: string;
}
