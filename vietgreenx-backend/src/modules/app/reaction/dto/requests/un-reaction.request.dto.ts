import { ReactionTargetType } from '@app/common/enums/reaction-target-type.enum';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsUUID } from 'class-validator';

export class UnReactionRequestDto {
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
}
