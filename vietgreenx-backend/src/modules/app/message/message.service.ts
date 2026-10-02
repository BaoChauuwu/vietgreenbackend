import { Injectable } from '@nestjs/common';
import { CreateDirectConversationRequestDto } from './dto/requests/create-direct-conversation.request.dto';
import { ConversationRepository } from '@app/database/typeorm/repositories/conversation.repository';
import {
	ErrorCode,
	HttpBadRequestError,
	HttpForbiddenError,
	HttpNotFoundError,
} from '@app/common/errors';
import { BlockService } from '@app/modules/app/block/block.service';
import { UserRepository } from '@app/database/typeorm/repositories/user.repository';
import { ConversationType } from '@app/common/enums/conversation-type.enum';
import { Conversation } from '@app/database/typeorm/entities/messaging/conversation.entity';
import { ConversationMember } from '@app/database/typeorm/entities/messaging/conversation-member.entity';
import { ConversationMemberRepository } from '@app/database/typeorm/repositories/conversation-member.repository';
import { GetConversationsQueryRequestDto } from './dto/requests/get-conversations-query.request.dto';
import { In, Not } from 'typeorm';
import { CreateMessageRequestDto } from './dto/requests/create-message.request.dto';
import { MediaRepository } from '@app/database/typeorm/repositories/media.repository';
import { Message } from '@app/database/typeorm/entities/messaging/message.entity';
import { MessageRepository } from '@app/database/typeorm/repositories/message.repository';
import { Media } from '@app/database/typeorm/entities';
import { GetMessagesQueryRequestDto } from './dto/requests/get-messages-query.request.dto';

@Injectable()
export class MessageService {
	constructor(
		private readonly conversationRepository: ConversationRepository,
		private readonly conversationMemberRepository: ConversationMemberRepository,
		private readonly userRepository: UserRepository,
		private readonly blockService: BlockService,
		private readonly mediaRepository: MediaRepository,
		private readonly messageRepository: MessageRepository,
	) {}

	async createConversation(
		userId: string,
		dto: CreateDirectConversationRequestDto,
	): Promise<Conversation> {
		if (userId === dto.targetUserId) {
			throw new HttpBadRequestError(ErrorCode.CANNOT_MESSAGE_SELF);
		}

		const user = await this.userRepository.findOne({ id: dto.targetUserId });
		if (!user) {
			throw new HttpNotFoundError(ErrorCode.USER_NOT_FOUND);
		}

		const isBlocked = await this.blockService.isEitherBlocked(
			userId,
			dto.targetUserId,
		);
		if (isBlocked) {
			throw new HttpNotFoundError(ErrorCode.USER_NOT_FOUND);
		}

		const existingConversation =
			await this.conversationRepository.findDirectConversation(
				userId,
				dto.targetUserId,
			);

		if (existingConversation) {
			return existingConversation;
		}

		return await this.conversationRepository.executeInTransaction(
			async (manager) => {
				const conversation = await manager.save(
					manager.create(Conversation, {
						conversationType: ConversationType.DIRECT,
					}),
				);

				const members = [
					manager.create(ConversationMember, {
						conversationId: conversation.id,
						userId: userId,
					}),

					manager.create(ConversationMember, {
						conversationId: conversation.id,
						userId: dto.targetUserId,
					}),
				];

				await manager.save(ConversationMember, members);

				return conversation;
			},
		);
	}

	async getMyConversation(
		userId: string,
		query: GetConversationsQueryRequestDto,
	) {
		const qb = this.conversationRepository
			.createQueryBuilder('conversation')
			.innerJoin(
				ConversationMember,
				'cm',
				'conversation.id = cm.conversationId AND cm.userId = :userId',
				{ userId },
			)
			.orderBy('conversation.lastMessageAt', 'DESC')
			.addOrderBy('conversation.id', 'DESC');

		const paginated = await this.conversationRepository.paginateWithCursor(
			qb,
			['lastMessageAt', 'id'],
			query.cursor,
			query.limit,
		);

		const conversations = paginated.data;
		if (conversations.length === 0) {
			return { ...paginated, data: [] };
		}

		const conversationIds = conversations.map((c) => c.id);

		const otherMembers = await this.conversationMemberRepository.findAll({
			where: {
				conversationId: In(conversationIds),
				userId: Not(userId),
			},
			relations: ['user', 'user.profile', 'user.profile.avatarMedia'],
		});

		const otherMembersMap = new Map<string, any[]>();
		otherMembers.forEach((otherMember) => {
			const list = otherMembersMap.get(otherMember.conversationId) || [];
			list.push(otherMember);
			otherMembersMap.set(otherMember.conversationId, list);
		});

		const [lastMessageRows, unreadRows] = await Promise.all([
			this.messageRepository.findLastMessagesForConversations(conversationIds),
			this.messageRepository.unreadCountsForConversations(
				conversationIds,
				userId,
			),
		]);

		const lastMessageMap = new Map(
			lastMessageRows.map((m) => [m.conversationId, m]),
		);
		const unreadMap = new Map(
			unreadRows.map((r) => [r.conversationId, parseInt(r.count, 10)]),
		);

		const data = conversations.map((conv) => {
			const partners = otherMembersMap.get(conv.id) || [];
			const partnerMember = partners[0];
			const lastMsg = lastMessageMap.get(conv.id) ?? null;
			return {
				...conv,
				partner: partnerMember
					? {
							id: partnerMember.user.id,
							displayName: partnerMember.user.profile?.displayName || '',
							avatarUrl:
								partnerMember.user.profile?.avatarMedia?.cdnUrl || null,
						}
					: null,
				lastMessage: lastMsg
					? {
							body: lastMsg.body,
							senderId: lastMsg.senderId,
							messageType: lastMsg.messageType,
							createdAt: lastMsg.createdAt,
						}
					: null,
				unreadCount: unreadMap.get(conv.id) ?? 0,
			};
		});

		return { ...paginated, data };
	}

	async createMessage(
		conversationId: string,
		userId: string,
		dto: CreateMessageRequestDto,
	) {
		if (!dto.body?.trim() && !dto.mediaId) {
			throw new HttpBadRequestError(ErrorCode.INVALID_MESSAGE_CONTENT);
		}

		if (dto.messageType === 'image' && !dto.mediaId) {
			throw new HttpBadRequestError(ErrorCode.INVALID_MESSAGE_CONTENT);
		}

		let messageType = dto.messageType || 'text';
		if (dto.mediaId && messageType === 'text') {
			messageType = 'image';
		}

		return await this.messageRepository.executeInTransaction(
			async (manager) => {
				const conversation = await manager.findOne(Conversation, {
					where: { id: conversationId },
					lock: { mode: 'pessimistic_write' },
				});
				if (!conversation) {
					throw new HttpNotFoundError(ErrorCode.CONVERSATION_NOT_FOUND);
				}

				const member = await manager.findOne(ConversationMember, {
					where: { conversationId, userId },
				});
				if (!member) {
					throw new HttpForbiddenError(ErrorCode.NOT_CONVERSATION_MEMBER);
				}

				if (conversation.conversationType === ConversationType.DIRECT) {
					const partnerMember = await manager.findOne(ConversationMember, {
						where: { conversationId, userId: Not(userId) },
					});
					if (partnerMember) {
						const isBlocked = await this.blockService.isEitherBlocked(
							userId,
							partnerMember.userId,
						);
						if (isBlocked) {
							throw new HttpNotFoundError(ErrorCode.USER_NOT_FOUND);
						}
					}
				}

				if (dto.mediaId) {
					const media = await manager.findOne(Media, {
						where: { id: dto.mediaId },
						lock: { mode: 'pessimistic_write' },
					});
					if (!media) {
						throw new HttpNotFoundError(ErrorCode.MEDIA_NOT_FOUND);
					}
					if (media.uploaderId !== userId) {
						throw new HttpForbiddenError(ErrorCode.MEDIA_NOT_OWNED);
					}
					if (media.processingStatus !== 'ready') {
						throw new HttpBadRequestError(ErrorCode.MEDIA_NOT_READY);
					}
				}

				const message = await manager.save(
					manager.create(Message, {
						conversationId,
						senderId: userId,
						body: dto.body?.trim() || null,
						mediaId: dto.mediaId || null,
						messageType,
						metadata: dto.metadata || {},
						readBy: [userId],
					}),
				);

				await manager.update(Conversation, conversationId, {
					lastMessageAt: message.createdAt,
				});

				return message;
			},
		);
	}

	async markConversationRead(
		conversationId: string,
		userId: string,
	): Promise<void> {
		const member = await this.conversationMemberRepository.findOne({
			conversationId,
			userId,
		});
		if (!member) {
			throw new HttpForbiddenError(ErrorCode.NOT_CONVERSATION_MEMBER);
		}
		await this.conversationMemberRepository.update(
			{ conversationId, userId },
			{ lastReadAt: new Date() },
		);
	}

	async getMessages(
		conversationId: string,
		userId: string,
		dto: GetMessagesQueryRequestDto,
	) {
		const conversation =
			await this.conversationRepository.findById(conversationId);
		if (!conversation) {
			throw new HttpNotFoundError(ErrorCode.CONVERSATION_NOT_FOUND);
		}

		const member = await this.conversationMemberRepository.findOne({
			conversationId,
			userId,
		});
		if (!member) {
			throw new HttpForbiddenError(ErrorCode.NOT_CONVERSATION_MEMBER);
		}

		const qb = this.messageRepository
			.createQueryBuilder('message')
			.leftJoinAndSelect('message.sender', 'sender')
			.leftJoinAndSelect('sender.profile', 'profile')
			.leftJoinAndSelect('profile.avatarMedia', 'avatarMedia')
			.where('message.conversationId = :conversationId', { conversationId })
			.andWhere('message.deletedAt IS NULL');
		qb.orderBy('message.createdAt', 'DESC').addOrderBy('message.id', 'DESC');
		const paginated = await this.messageRepository.paginateWithCursor(
			qb,
			['createdAt', 'id'],
			dto.cursor,
			dto.limit,
		);

		return paginated;
	}
}
