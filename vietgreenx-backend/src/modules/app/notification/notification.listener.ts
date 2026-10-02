import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { CommentCreatedEvent } from '../comment/events/comment-created.event';
import { NotificationService } from './notification.service';
import { PostCreatedEvent } from '../post/events/post-created.event';
import { FollowCreatedEvent } from '../follow/events/follow-created.event';
import { ReactionCreatedEvent } from '../reaction/events/reaction-created.event';
import { ReactionRemovedEvent } from '../reaction/events/reaction-removed.event';
import { ReactionUpdatedEvent } from '../reaction/events/reaction-updated.event';

@Injectable()
export class NotificationListener {
	private readonly logger = new Logger(NotificationListener.name);

	constructor(private readonly notificationService: NotificationService) {}

	@OnEvent('comment.created', { async: true })
	async handleCommentCreatedEvent(event: CommentCreatedEvent): Promise<void> {
		try {
			const { comment } = event;
			if (!comment || !comment.body) {
				return;
			}

			const deepLink = `/posts/${comment.postId}`;
			const excludeUserIds: string[] = [];
			let parentAuthorId: string | null = null;

			if (comment.parentCommentId) {
				parentAuthorId =
					await this.notificationService.triggerCommentReplyNotification(
						comment,
					);
				if (parentAuthorId) {
					excludeUserIds.push(parentAuthorId);
				}
			}

			const postAuthorId =
				await this.notificationService.triggerPostCommentNotification(
					comment,
					parentAuthorId ?? undefined,
				);
			if (postAuthorId) {
				excludeUserIds.push(postAuthorId);
			}

			await this.notificationService.processMentions(
				comment.body,
				comment.authorId,
				'comment',
				comment.id,
				deepLink,
				excludeUserIds,
			);
		} catch (error) {
			this.logger.error(
				'Error handling comment.created event for mention notification',
				error instanceof Error ? error.stack : error,
			);
		}
	}

	@OnEvent('post.created', { async: true })
	async handlePostCreatedEvent(event: PostCreatedEvent): Promise<void> {
		try {
			const { post } = event;
			if (!post || !post.body) {
				return;
			}

			const deepLink = `/posts/${post.id}`;

			await this.notificationService.processMentions(
				post.body,
				post.authorId,
				'post',
				post.id,
				deepLink,
			);
		} catch (error) {
			this.logger.error(
				'Error handling post.created event for mention notification',
				error instanceof Error ? error.stack : error,
			);
		}
	}

	@OnEvent('follow.created', { async: true })
	async handleFollowCreatedEvent(event: FollowCreatedEvent): Promise<void> {
		try {
			const { follow } = event;
			if (!follow) return;
			await this.notificationService.triggerFollowNotification(follow);
		} catch (error) {
			this.logger.error(
				'Error handling follow.created event for follow notification',
				error instanceof Error ? error.stack : error,
			);
		}
	}

	@OnEvent('reaction.created', { async: true })
	async handleReactionCreatedEvent(event: ReactionCreatedEvent): Promise<void> {
		try {
			await this.notificationService.triggerReactionNotification(event);
		} catch (error) {
			this.logger.error(
				'Error handling reaction.created event for notification',
				error instanceof Error ? error.stack : error,
			);
		}
	}

	@OnEvent('reaction.removed', { async: true })
	async handleReactionRemovedEvent(event: ReactionRemovedEvent): Promise<void> {
		try {
			await this.notificationService.removeReactionNotification(event);
		} catch (error) {
			this.logger.error(
				'Error handling reaction.removed event for notification',
				error instanceof Error ? error.stack : error,
			);
		}
	}

	@OnEvent('reaction.updated', { async: true })
	async handleReactionUpdatedEvent(event: ReactionUpdatedEvent): Promise<void> {
		try {
			await this.notificationService.updateReactionNotification(event);
		} catch (error) {
			this.logger.error(
				'Error handling reaction.updated event for notification',
				error instanceof Error ? error.stack : error,
			);
		}
	}
}
