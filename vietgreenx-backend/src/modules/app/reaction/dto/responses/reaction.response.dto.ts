import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { ReactionType } from '@app/common/enums/reaction-type.enum';
import { ReactionTargetType } from '@app/common/enums/reaction-target-type.enum';

export class ReactionResponseDto {
	@ApiProperty()
	@Expose()
	id: string;

	@ApiProperty()
	@Expose()
	userId: string;

	@ApiProperty()
	@Expose()
	targetId: string;

	@ApiProperty({ enum: ReactionTargetType })
	@Expose()
	targetType: ReactionTargetType;

	@ApiProperty({ enum: ReactionType })
	@Expose()
	reaction: ReactionType;

	@ApiProperty()
	@Expose()
	createdAt: Date;
}
