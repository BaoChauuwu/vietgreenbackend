export class CommentDeletedEvent {
	constructor(
		public readonly commentId: string,
		public readonly postId: string,
		public readonly parentCommentId: string | null,
		public readonly userId: string,
	) {}
}
