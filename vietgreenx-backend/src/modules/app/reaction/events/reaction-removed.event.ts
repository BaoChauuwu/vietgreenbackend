import { ReactionTargetType } from '@app/common/enums/reaction-target-type.enum';

export class ReactionRemovedEvent {
	constructor(
		public readonly userId: string,
		public readonly targetId: string,
		public readonly targetType: ReactionTargetType,
	) {}
}
