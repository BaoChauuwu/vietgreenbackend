import { Post } from '../../../../database/typeorm/entities/content/post.entity';

export class PostCreatedEvent {
	constructor(public readonly post: Post) {}
}
