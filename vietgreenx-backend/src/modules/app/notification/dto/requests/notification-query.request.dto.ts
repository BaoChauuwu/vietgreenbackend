import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
	IsBoolean,
	IsInt,
	IsOptional,
	IsString,
	Max,
	Min,
} from 'class-validator';

export class NotificationQueryRequest {
	@ApiPropertyOptional({
		example: 20,
		description: 'Number of notifications per page',
		default: 20,
	})
	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@Min(1)
	@Max(100)
	limit?: number;

	@ApiPropertyOptional({
		description: 'Cursor from previous response nextCursor',
	})
	@IsOptional()
	@IsString()
	cursor?: string;

	@ApiPropertyOptional({
		type: Boolean,
		description: 'filter by isRead',
	})
	@IsOptional()
	@Transform(({ value }) => {
		if (value === 'true' || value === true) return true;
		if (value === 'false' || value === false) return false;
		return value;
	})
	@IsBoolean()
	isRead?: boolean;
}
