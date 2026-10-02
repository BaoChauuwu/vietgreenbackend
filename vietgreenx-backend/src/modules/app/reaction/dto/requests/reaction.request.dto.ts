import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsUUID } from 'class-validator';
import { ReactionType } from '@app/common/enums/reaction-type.enum';
import { ReactionTargetType } from '@app/common/enums/reaction-target-type.enum';

export class ReactionRequestDto {
	@ApiProperty({ description: 'The UUID of the post or comment' })
	@IsNotEmpty()
	@IsUUID()
	targetId: string;
	@ApiProperty({
		description: 'The type of the target',
		enum: ReactionTargetType,
	})
	@IsNotEmpty()
	@IsEnum(ReactionTargetType)
	targetType: ReactionTargetType;
	@ApiProperty({ description: 'The type of reaction', enum: ReactionType })
	@IsNotEmpty()
	@IsEnum(ReactionType)
	reaction: ReactionType;
}
