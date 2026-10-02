import { ReactionTargetType } from '@app/common/enums/reaction-target-type.enum';
import { ReactionType } from '@app/common/enums/reaction-type.enum';

export class ReactionUpdatedEvent {
	constructor(
		public readonly userId: string,
		public readonly targetId: string,
		public readonly targetType: ReactionTargetType,
		public readonly reaction: ReactionType,
	) {}
}
