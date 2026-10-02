import { Follow } from '@app/database/typeorm/entities/social-graph/follow.entity';

export class FollowCreatedEvent {
	constructor(public readonly follow: Follow) {}
}
