import { Comment } from '../../../../database/typeorm/entities/engagement/comment.entity';

export class CommentCreatedEvent {
	constructor(public readonly comment: Comment) {}
}
