import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class FollowQueryRequestDto {
	@ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@Min(1)
	@Max(50)
	limit?: number = 20;

	@ApiPropertyOptional({
		description: 'Cursor to get next page (from nextCursor)',
	})
	@IsOptional()
	@IsString()
	cursor?: string;
}
