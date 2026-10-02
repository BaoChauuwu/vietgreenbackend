import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { ReactionTargetType } from '@app/common/enums/reaction-target-type.enum';
import { ReactionType } from '@app/common/enums/reaction-type.enum';
import { PaginationDto } from '@app/common/dtos/paginationDto';

export class ListReactionsRequestDto extends PaginationDto {
	@ApiProperty({ description: 'UUID of the target (post or comment)' })
	@IsUUID()
	targetId: string;

	@ApiProperty({ enum: ReactionTargetType })
	@IsEnum(ReactionTargetType)
	targetType: ReactionTargetType;

	@ApiPropertyOptional({
		enum: ReactionType,
		description: 'Filter by reaction type',
	})
	@IsOptional()
	@IsEnum(ReactionType)
	reaction?: ReactionType;
}
