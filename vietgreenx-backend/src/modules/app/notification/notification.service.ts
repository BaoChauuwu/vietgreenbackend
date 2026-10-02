import { Injectable, Logger } from '@nestjs/common';
import { NotificationRepository } from '../../../database/typeorm/repositories/notification.repository';
import { UserRepository } from '../../../database/typeorm/repositories/user.repository';
import { NotifType } from '../../../common/enums/notif-type.enum';
import { In } from 'typeorm';
import { BlockService } from '../block/block.service';
import { FollowStatus } from '@app/common/enums/follow-status.enum';
import { Comment, Follow } from '@app/database/typeorm/entities';
import { NotificationQueryRequest } from './dto/requests/notification-query.request.dto';
import {
	ErrorCode,
	HttpForbiddenError,
	HttpNotFoundError,
} from '@app/common/errors';
import { PostRepository } from '@app/database/typeorm/repositories/post.repository';
import { CommentRepository } from '@app/database/typeorm/repositories/comment.repository';
import { FcmDeviceRepository } from '@app/database/typeorm/repositories/fcm-device.repository';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { NOTIFICATION_QUEUE, SEND_PUSH_JOB } from './notification.queue';
import { ReactionCreatedEvent } from '../reaction/events/reaction-created.event';
import { ReactionRemovedEvent } from '../reaction/events/reaction-removed.event';
import { ReactionUpdatedEvent } from '../reaction/events/reaction-updated.event';
import { ReactionTargetType } from '@app/common/enums/reaction-target-type.enum';
import { ReactionType } from '@app/common/enums/reaction-type.enum';

@Injectable()
export class NotificationService {
	private readonly logger = new Logger(NotificationService.name);

	constructor(
		private readonly notificationRepository: NotificationRepository,
		private readonly userRepository: UserRepository,
		private readonly blockService: BlockService,
		private readonly postRepository: PostRepository,
		private readonly commentRepository: CommentRepository,
		private readonly fcmDeviceRepository: FcmDeviceRepository,
		@InjectQueue(NOTIFICATION_QUEUE) private readonly notifQueue: Queue,
	) {}

	async registerDevice(
		userId: string,
		fcmToken: string,
		platform?: string,
	): Promise<void> {
		try {
			await this.fcmDeviceRepository.upsert(
				[{ userId, fcmToken, platform: platform ?? 'unknown', isActive: true }],
				['fcmToken'],
			);
		} catch (err) {
			this.logger.warn('FCM device upsert failed', err);
		}
	}

	async unregisterDevice(fcmToken: string): Promise<void> {
		try {
			await this.fcmDeviceRepository.update({ fcmToken }, { isActive: false });
		} catch (err) {
			this.logger.warn('FCM device deactivate failed', err);
		}
	}

	parseMentions(text: string): string[] {
		if (!text) return [];
		const regex = /(?:^|\s)@([a-zA-Z0-9_]+)/g;
		const usernames: string[] = [];
		let match: RegExpExecArray | null;

		while ((match = regex.exec(text)) !== null) {
			usernames.push(match[1]);
		}

		return Array.from(new Set(usernames));
	}

	async processMentions(
		text: string,
		actorId: string,
		entityType: string,
		entityId: string,
		deepLink: string,
		excludeUserIds: string[] = [],
	): Promise<void> {
		try {
			const usernames = this.parseMentions(text);
			if (usernames.length === 0) {
				return;
			}

			const actor = await this.userRepository.findOne({ id: actorId });
			const actorName = actor ? `@${actor.username}` : 'Ai đó';

			const targetUsernames = usernames.filter(
				(username) =>
					!actor || username.toLowerCase() !== actor.username.toLowerCase(),
			);

			if (targetUsernames.length === 0) {
				return;
			}

			const allRecipients = await this.userRepository.findAll({
				where: {
					username: In(targetUsernames),
				},
			});

			if (allRecipients.length === 0) {
				return;
			}

			const blockedUserIds = await this.blockService.getBlockedUserIds(actorId);
			const recipients = allRecipients.filter(
				(recipient) =>
					!blockedUserIds.includes(recipient.id) &&
					!excludeUserIds.includes(recipient.id),
			);

			if (recipients.length === 0) {
				return;
			}

			const title =
				entityType === 'post'
					? `${actorName} đã nhắc đến bạn trong một bài viết`
					: `${actorName} đã nhắc đến bạn trong một bình luận`;
			const bodyPreview =
				text.length > 200 ? `${text.substring(0, 197)}...` : text;

			const notificationPromises = recipients.map(async (recipient) => {
				await this.notificationRepository.create({
					recipientId: recipient.id,
					actorId,
					notifType: NotifType.MENTION,
					entityType,
					entityId,
					title,
					body: bodyPreview,
					deepLink,
					isRead: false,
				});
				this.notifQueue
					.add(SEND_PUSH_JOB, {
						userId: recipient.id,
						title,
						body: bodyPreview,
					})
					.catch((err) =>
						this.logger.error('Failed to enqueue push notification', err),
					);
			});

			await Promise.all(notificationPromises);
			this.logger.log(
				`Successfully triggered ${recipients.length} mention notification(s) for ${entityType} ${entityId}`,
			);
		} catch (error) {
			this.logger.error(
				'Failed to process mentions and trigger notifications',
				error instanceof Error ? error.stack : error,
			);
		}
	}

	async triggerFollowNotification(follow: Follow) {
		try {
			if (!follow.followeeUserId) return;

			const isBlocked = await this.blockService.isEitherBlocked(
				follow.followerId,
				follow.followeeUserId,
			);
			if (isBlocked) return;

			const actor = await this.userRepository.findOne({
				id: follow.followerId,
			});

			const actorName = actor ? `@${actor.username}` : 'Ai đó';

			const title =
				follow.status === FollowStatus.PENDING
					? `${actorName} đã gửi yêu cầu theo dõi`
					: `${actorName} đã theo dõi bạn`;

			await this.notificationRepository.create({
				recipientId: follow.followeeUserId,
				actorId: follow.followerId,
				notifType: NotifType.NEW_FOLLOWER,
				entityType: 'follow',
				entityId: follow.id,
				title: title,
				body: '',
				deepLink: `/users/${follow.followerId}`,
				isRead: false,
			});
			this.notifQueue
				.add(SEND_PUSH_JOB, { userId: follow.followeeUserId, title, body: '' })
				.catch((err) =>
					this.logger.error('Failed to enqueue push notification', err),
				);
		} catch (error) {
			this.logger.error(
				'Failed to trigger follow notification',
				error instanceof Error ? error.stack : error,
			);
		}
	}

	async findAll(userId: string, dto: NotificationQueryRequest) {
		const limit = dto.limit ?? 20;
		const blockedUserIds = await this.blockService.getBlockedUserIds(userId);

		const qb = this.notificationRepository
			.createQueryBuilder('notification')
			.leftJoinAndSelect('notification.actor', 'actor')
			.leftJoinAndSelect('actor.profile', 'profile')
			.leftJoinAndSelect('profile.avatarMedia', 'avatarMedia')
			.where('notification.recipientId = :recipientId', {
				recipientId: userId,
			});

		if (dto.isRead !== undefined) {
			qb.andWhere('notification.isRead = :isRead', {
				isRead: dto.isRead,
			});
		}

		if (blockedUserIds.length > 0) {
			qb.andWhere(
				'(notification.actorId IS NULL OR notification.actorId NOT IN (:...blockedUserIds))',
				{ blockedUserIds },
			);
		}

		qb.orderBy('notification.createdAt', 'DESC').addOrderBy(
			'notification.id',
			'DESC',
		);

		return this.notificationRepository.paginateWithCursor(
			qb,
			['createdAt', 'id'],
			dto.cursor,
			limit,
		);
	}

	async getUnreadCount(userId: string): Promise<{ count: number }> {
		const blockedUserIds = await this.blockService.getBlockedUserIds(userId);
		const qb = this.notificationRepository
			.createQueryBuilder('notification')
			.where('notification.recipientId = :recipientId', { recipientId: userId })
			.andWhere('notification.isRead = :isRead', { isRead: false });

		if (blockedUserIds.length > 0) {
			qb.andWhere(
				'(notification.actorId IS NULL OR notification.actorId NOT IN (:...blockedUserIds))',
				{ blockedUserIds },
			);
		}

		const count = await qb.getCount();
		return { count };
	}

	async markAsRead(userId: string, notificationId: string) {
		const notification =
			await this.notificationRepository.findById(notificationId);

		const blockedUserIds = await this.blockService.getBlockedUserIds(userId);

		if (!notification) {
			throw new HttpNotFoundError(ErrorCode.NOTIFICATION_NOT_FOUND);
		}

		if (notification.recipientId !== userId) {
			throw new HttpForbiddenError(ErrorCode.NOTIFICATION_FORBIDDEN);
		}

		if (
			notification.actorId !== null &&
			blockedUserIds.includes(notification.actorId)
		) {
			throw new HttpNotFoundError(ErrorCode.NOTIFICATION_NOT_FOUND);
		}

		if (!notification.isRead) {
			await this.notificationRepository.update(notificationId, {
				isRead: true,
				readAt: new Date(),
			});
		}

		const updatedNotification = await this.notificationRepository.findOne(
			{ id: notificationId },
			['actor', 'actor.profile', 'actor.profile.avatarMedia'],
		);

		return updatedNotification;
	}

	async markAllAsRead(userId: string) {
		const blockedUserIds = await this.blockService.getBlockedUserIds(userId);
		const qb = this.notificationRepository
			.createQueryBuilder('notification')
			.update()
			.set({ isRead: true, readAt: new Date() })
			.where('recipientId = :userId', { userId })
			.andWhere('isRead = :isRead', { isRead: false });

		if (blockedUserIds.length > 0) {
			qb.andWhere('(actorId IS NULL OR actorId NOT IN (:...blockedUserIds))', {
				blockedUserIds,
			});
		}

		await qb.execute();
	}

	async triggerPostCommentNotification(
		comment: Comment,
		excludeUserId?: string,
	): Promise<string | null> {
		try {
			const post = await this.postRepository.findOne({
				id: comment.postId,
			});
			if (!post) return null;

			if (excludeUserId && post.authorId === excludeUserId) return null;

			if (post.authorId === comment.authorId) return null;

			const isBlocked = await this.blockService.isEitherBlocked(
				comment.authorId,
				post.authorId,
			);
			if (isBlocked) return null;

			const actor =
				comment.author ??
				(await this.userRepository.findOne({ id: comment.authorId }));

			const actorName = actor ? `@${actor.username}` : `Ai đó`;

			const title = `${actorName} đã bình luận về bài viết của bạn`;

			const bodyPreview =
				comment.body.length > 200
					? `${comment.body.substring(0, 197)}...`
					: comment.body;

			await this.notificationRepository.create({
				recipientId: post.authorId,
				actorId: comment.authorId,
				notifType: NotifType.POST_COMMENT,
				entityType: 'comment',
				entityId: comment.id,
				title,
				body: bodyPreview,
				deepLink: `/posts/${comment.postId}`,
				isRead: false,
			});
			this.notifQueue
				.add(SEND_PUSH_JOB, { userId: post.authorId, title, body: bodyPreview })
				.catch((err) =>
					this.logger.error('Failed to enqueue push notification', err),
				);
			return post.authorId;
		} catch (error) {
			this.logger.error(
				'Failed to trigger post comment notification',
				error instanceof Error ? error.stack : error,
			);
			return null;
		}
	}

	async triggerReactionNotification(
		event: ReactionCreatedEvent,
	): Promise<void> {
		try {
			const { userId: actorId, targetId, targetType, reaction } = event;

			const reactionLabel: Record<ReactionType, string> = {
				[ReactionType.LIKE]: 'thích',
				[ReactionType.LOVE]: 'yêu thích',
				[ReactionType.HELPFUL]: 'thấy hữu ích',
				[ReactionType.TRUST]: 'tin tưởng',
				[ReactionType.GREEN]: 'xanh 🌱',
			};
			const label = reactionLabel[reaction] ?? reaction;

			let recipientId: string;
			let notifType: NotifType;
			let deepLink: string;

			if (targetType === ReactionTargetType.POST) {
				const post = await this.postRepository.findOne({ id: targetId });
				if (!post || post.authorId === actorId) return;
				recipientId = post.authorId;
				notifType = NotifType.POST_REACTION;
				deepLink = `/posts/${targetId}`;
			} else {
				const comment = await this.commentRepository.findOne({ id: targetId });
				if (!comment || comment.authorId === actorId) return;
				recipientId = comment.authorId;
				notifType = NotifType.COMMENT_REACTION;
				deepLink = `/posts/${comment.postId}`;
			}

			const isBlocked = await this.blockService.isEitherBlocked(
				actorId,
				recipientId,
			);
			if (isBlocked) return;

			const actor = await this.userRepository.findOne({ id: actorId });
			const actorName = actor ? `@${actor.username}` : 'Ai đó';

			const title =
				targetType === ReactionTargetType.POST
					? `${actorName} đã ${label} bài viết của bạn`
					: `${actorName} đã ${label} bình luận của bạn`;

			await this.notificationRepository.create({
				recipientId,
				actorId,
				notifType,
				entityType: targetType,
				entityId: targetId,
				title,
				body: '',
				deepLink,
				isRead: false,
			});

			this.notifQueue
				.add(SEND_PUSH_JOB, { userId: recipientId, title, body: '' })
				.catch((err) =>
					this.logger.error('Failed to enqueue push notification', err),
				);
		} catch (error) {
			this.logger.error(
				'Failed to trigger reaction notification',
				error instanceof Error ? error.stack : error,
			);
		}
	}

	async triggerCommentReplyNotification(
		comment: Comment,
	): Promise<string | null> {
		try {
			if (!comment.parentCommentId) return null;

			const parentComment = await this.commentRepository.findOne({
				id: comment.parentCommentId,
			});
			if (!parentComment) return null;

			if (parentComment.authorId === comment.authorId) return null;

			const isBlocked = await this.blockService.isEitherBlocked(
				comment.authorId,
				parentComment.authorId,
			);
			if (isBlocked) return null;

			const actor =
				comment.author ??
				(await this.userRepository.findOne({ id: comment.authorId }));
			const actorName = actor ? `@${actor.username}` : 'Ai đó';

			const title = `${actorName} đã trả lời bình luận của bạn`;
			const bodyPreview =
				comment.body.length > 200
					? `${comment.body.substring(0, 197)}...`
					: comment.body;

			await this.notificationRepository.create({
				recipientId: parentComment.authorId,
				actorId: comment.authorId,
				notifType: NotifType.COMMENT_REPLY,
				entityType: 'comment',
				entityId: comment.id,
				title,
				body: bodyPreview,
				deepLink: `/posts/${comment.postId}`,
				isRead: false,
			});
			this.notifQueue
				.add(SEND_PUSH_JOB, {
					userId: parentComment.authorId,
					title,
					body: bodyPreview,
				})
				.catch((err) =>
					this.logger.error('Failed to enqueue push notification', err),
				);
			return parentComment.authorId;
		} catch (error) {
			this.logger.error(
				'Failed to trigger comment reply notification',
				error instanceof Error ? error.stack : error,
			);
			return null;
		}
	}

	async sendReportActionedNotification(
		reporterId: string,
		action: 'actioned' | 'dismissed',
	): Promise<void> {
		try {
			const isActioned = action === 'actioned';
			const title = isActioned
				? 'Your report has been reviewed'
				: 'Your report has been reviewed';
			const body = isActioned
				? 'The content you reported has been actioned by our moderation team.'
				: 'After review, no action was taken on the content you reported.';

			await this.notificationRepository.create({
				recipientId: reporterId,
				actorId: null,
				notifType: NotifType.REPORT_ACTIONED,
				entityType: 'report',
				entityId: null,
				title,
				body,
				deepLink: '/reports',
				isRead: false,
			});

			this.notifQueue
				.add(SEND_PUSH_JOB, { userId: reporterId, title, body })
				.catch((err) =>
					this.logger.error(
						'Failed to enqueue report actioned push notification',
						err,
					),
				);
		} catch (error) {
			this.logger.error(
				'Failed to send report actioned notification',
				error instanceof Error ? error.stack : error,
			);
		}
	}

	async sendVerificationNotification(
		recipientId: string,
		notifType:
			| NotifType.VERIFICATION_APPROVED
			| NotifType.VERIFICATION_REJECTED,
	): Promise<void> {
		try {
			const isApproved = notifType === NotifType.VERIFICATION_APPROVED;
			const title = isApproved
				? 'Organization verification approved'
				: 'Organization verification rejected';
			const body = isApproved
				? 'Your organization has been verified successfully.'
				: 'Your organization verification request was not approved.';

			await this.notificationRepository.create({
				recipientId,
				actorId: null,
				notifType,
				entityType: 'verification',
				entityId: null,
				title,
				body,
				deepLink: '/organization/profile',
				isRead: false,
			});

			this.notifQueue
				.add(SEND_PUSH_JOB, { userId: recipientId, title, body })
				.catch((err) =>
					this.logger.error(
						'Failed to enqueue verification push notification',
						err,
					),
				);
		} catch (error) {
			this.logger.error(
				'Failed to send verification notification',
				error instanceof Error ? error.stack : error,
			);
		}
	}

	async removeReactionNotification(event: ReactionRemovedEvent): Promise<void> {
		try {
			const { userId: actorId, targetId, targetType } = event;
			const notifType =
				targetType === ReactionTargetType.POST
					? NotifType.POST_REACTION
					: NotifType.COMMENT_REACTION;

			await this.notificationRepository.delete({
				actorId,
				entityId: targetId,
				notifType,
			});
		} catch (error) {
			this.logger.error(
				'Failed to remove reaction notification',
				error instanceof Error ? error.stack : error,
			);
		}
	}

	async updateReactionNotification(event: ReactionUpdatedEvent): Promise<void> {
		try {
			const { userId: actorId, targetId, targetType, reaction } = event;
			const notifType =
				targetType === ReactionTargetType.POST
					? NotifType.POST_REACTION
					: NotifType.COMMENT_REACTION;

			const existing = await this.notificationRepository.findOne({
				actorId,
				entityId: targetId,
				notifType,
				isRead: false,
			});
			if (!existing) return;

			const reactionLabel: Record<ReactionType, string> = {
				[ReactionType.LIKE]: 'thích',
				[ReactionType.LOVE]: 'yêu thích',
				[ReactionType.HELPFUL]: 'thấy hữu ích',
				[ReactionType.TRUST]: 'tin tưởng',
				[ReactionType.GREEN]: 'xanh 🌱',
			};
			const label = reactionLabel[reaction] ?? reaction;

			const actor = await this.userRepository.findOne({ id: actorId });
			const actorName = actor ? `@${actor.username}` : 'Ai đó';

			const title =
				notifType === NotifType.POST_REACTION
					? `${actorName} đã ${label} bài viết của bạn`
					: `${actorName} đã ${label} bình luận của bạn`;

			await this.notificationRepository.update(existing.id, { title });
		} catch (error) {
			this.logger.error(
				'Failed to update reaction notification',
				error instanceof Error ? error.stack : error,
			);
		}
	}
}
