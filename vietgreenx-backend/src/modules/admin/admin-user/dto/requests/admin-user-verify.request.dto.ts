import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { VerificationLevel } from '@app/common/enums/verification-level.enum';

export enum VerifyAction {
	APPROVE = 'approve',
	REJECT = 'reject',
}

export class AdminUserVerifyRequestDto {
	@ApiProperty({ enum: VerifyAction })
	@IsEnum(VerifyAction)
	action: VerifyAction;

	@ApiPropertyOptional({ description: 'Tier to grant on approve' })
	@IsOptional()
	@IsEnum(VerificationLevel)
	level?: VerificationLevel;

	@ApiPropertyOptional({ description: 'Reason for rejection' })
	@IsOptional()
	@IsString()
	@MaxLength(500)
	reason?: string;
}
