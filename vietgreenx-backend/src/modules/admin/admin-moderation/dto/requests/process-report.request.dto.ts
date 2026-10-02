import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum ModerationAction {
	REMOVE = 'remove',
	WARN = 'warn',
	BAN = 'ban',
	DISMISS = 'dismiss',
}

export class ProcessReportRequestDto {
	@ApiProperty({ enum: ModerationAction })
	@IsEnum(ModerationAction)
	action: ModerationAction;

	@ApiPropertyOptional()
	@IsOptional()
	@IsString()
	note?: string;
}
