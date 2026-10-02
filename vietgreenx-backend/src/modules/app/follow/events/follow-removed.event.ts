import { Follow } from '@app/database/typeorm/entities/social-graph/follow.entity';

export class FollowRemovedEvent {
	constructor(public readonly follow: Follow) {}
}
