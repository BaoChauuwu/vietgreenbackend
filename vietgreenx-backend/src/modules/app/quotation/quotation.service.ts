import { Injectable } from '@nestjs/common';
import { QuotationRepository } from '@app/database/typeorm/repositories/quotation.repository';
import { ConversationRepository } from '@app/database/typeorm/repositories/conversation.repository';
import { NotificationRepository } from '@app/database/typeorm/repositories/notification.repository';
import { TradePostRepository } from '@app/database/typeorm/repositories/trade-post.repository';
import { QuotationStatus } from '@app/common/enums/quotation-status.enum';
import { NotifType } from '@app/common/enums/notif-type.enum';
import { ConversationType } from '@app/common/enums/conversation-type.enum';
import {
	HttpBadRequestError,
	HttpForbiddenError,
	HttpNotFoundError,
} from '@app/common/errors';
import { ErrorCode } from '@app/common/errors/error-code';
import { CreateQuotationRequestDto } from './dto/requests/create-quotation.request.dto';
import { RejectQuotationRequestDto } from './dto/requests/reject-quotation.request.dto';
import {
	ListQuotationsRequestDto,
	QuotationDirection,
} from './dto/requests/list-quotations.request.dto';
import { Conversation } from '@app/database/typeorm/entities/messaging/conversation.entity';
import { ConversationMember } from '@app/database/typeorm/entities/messaging/conversation-member.entity';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import {
	NOTIFICATION_QUEUE,
	SEND_PUSH_JOB,
} from '@app/modules/app/notification/notification.queue';
import { Logger } from '@nestjs/common';

const QUOTATION_VALIDITY_DAYS = 7;

@Injectable()
export class QuotationService {
	private readonly logger = new Logger(QuotationService.name);

	constructor(
		private readonly quotationRepository: QuotationRepository,
		private readonly conversationRepository: ConversationRepository,
		private readonly notificationRepository: NotificationRepository,
		private readonly tradePostRepository: TradePostRepository,
		@InjectQueue(NOTIFICATION_QUEUE) private readonly notifQueue: Queue,
	) {}

	async createQuotation(senderId: string, dto: CreateQuotationRequestDto) {
		if (senderId === dto.receiverUserId) {
			throw new HttpBadRequestError(ErrorCode.QUOTATION_CANNOT_SEND_TO_SELF);
		}

		if (dto.tradePostId) {
			const tradePost = await this.tradePostRepository.findById(
				dto.tradePostId,
			);
			if (!tradePost) {
				throw new HttpNotFoundError(ErrorCode.TRADE_POST_NOT_FOUND);
			}
			const existing = await this.quotationRepository.findOne({
				senderUserId: senderId,
				tradePostId: dto.tradePostId,
				status: QuotationStatus.PENDING,
			});
			if (existing) {
				throw new HttpBadRequestError(ErrorCode.QUOTATION_ALREADY_SENT);
			}
		}

		const expiresAt = new Date();
		expiresAt.setDate(expiresAt.getDate() + QUOTATION_VALIDITY_DAYS);

		const validUntil = expiresAt.toISOString().split('T')[0];

		const quotation = await this.quotationRepository.create({
			tradePostId: dto.tradePostId ?? null,
			senderUserId: senderId,
			receiverUserId: dto.receiverUserId,
			productId: dto.productId ?? null,
			offeredPrice: dto.offeredPrice,
			priceUnit: dto.priceUnit,
			quantity: dto.quantity,
			quantityUnit: dto.quantityUnit,
			deliveryTerms: dto.deliveryTerms ?? null,
			notes: dto.notes ?? null,
			status: QuotationStatus.PENDING,
			validUntil,
			expiresAt,
		});

		this.sendNotification(
			dto.receiverUserId,
			senderId,
			NotifType.NEW_QUOTATION,
			'quotation',
			quotation.id,
			'New quotation received',
			'Someone sent you a quotation. Tap to review it.',
			`/quotations/${quotation.id}`,
		).catch(() => {});

		return quotation;
	}

	async findAll(userId: string, dto: ListQuotationsRequestDto) {
		const page = dto.page ?? 1;
		const limit = dto.limit ?? 20;

		const where: Record<string, any> = {};
		if (dto.direction === QuotationDirection.SENT) {
			where.senderUserId = userId;
		} else if (dto.direction === QuotationDirection.RECEIVED) {
			where.receiverUserId = userId;
		} else {
			// default: both sent and received — handled in raw query
		}
		if (dto.status) {
			where.status = dto.status;
		}

		if (!dto.direction) {
			return this.findAllBothDirections(userId, page, limit, dto.status);
		}

		const paginated = await this.quotationRepository.findWithPagination(
			page,
			limit,
			{
				where,
				relations: [
					'sender',
					'sender.profile',
					'sender.profile.avatarMedia',
					'receiver',
					'receiver.profile',
					'receiver.profile.avatarMedia',
				],
				order: { createdAt: 'DESC' },
			},
		);

		return {
			...paginated,
			items: paginated.items.map((q) => this.mapQuotation(q)),
		};
	}

	private async findAllBothDirections(
		userId: string,
		page: number,
		limit: number,
		status?: QuotationStatus,
	) {
		const where: any[] = [
			{ senderUserId: userId, ...(status ? { status } : {}) },
			{ receiverUserId: userId, ...(status ? { status } : {}) },
		];

		const paginated = await this.quotationRepository.findWithPagination(
			page,
			limit,
			{
				where,
				relations: [
					'sender',
					'sender.profile',
					'sender.profile.avatarMedia',
					'receiver',
					'receiver.profile',
					'receiver.profile.avatarMedia',
				],
				order: { createdAt: 'DESC' },
			},
		);

		return {
			...paginated,
			items: paginated.items.map((q) => this.mapQuotation(q)),
		};
	}

	async findOne(id: string, userId: string) {
		const quotation = await this.quotationRepository.findOne({ id }, [
			'sender',
			'sender.profile',
			'sender.profile.avatarMedia',
			'receiver',
			'receiver.profile',
			'receiver.profile.avatarMedia',
		]);
		if (!quotation) {
			throw new HttpNotFoundError(ErrorCode.QUOTATION_NOT_FOUND);
		}
		if (
			quotation.senderUserId !== userId &&
			quotation.receiverUserId !== userId
		) {
			throw new HttpForbiddenError(ErrorCode.QUOTATION_FORBIDDEN);
		}
		return this.mapQuotation(quotation);
	}

	async acceptQuotation(id: string, userId: string) {
		const quotation = await this.quotationRepository.findById(id);
		if (!quotation) {
			throw new HttpNotFoundError(ErrorCode.QUOTATION_NOT_FOUND);
		}
		if (quotation.receiverUserId !== userId) {
			throw new HttpForbiddenError(ErrorCode.QUOTATION_FORBIDDEN);
		}
		if (quotation.status !== QuotationStatus.PENDING) {
			throw new HttpBadRequestError(ErrorCode.QUOTATION_NOT_PENDING);
		}

		await this.quotationRepository.update(id, {
			status: QuotationStatus.ACCEPTED,
			acceptedAt: new Date(),
		} as any);

		// Auto-open chat conversation between sender and receiver
		await this.getOrCreateDirectConversation(
			quotation.senderUserId,
			quotation.receiverUserId,
		);

		this.sendNotification(
			quotation.senderUserId,
			userId,
			NotifType.QUOTATION_ACCEPTED,
			'quotation',
			quotation.id,
			'Quotation accepted',
			'Your quotation has been accepted. Open the chat to continue.',
			`/quotations/${quotation.id}`,
		).catch(() => {});

		return this.findOne(id, userId);
	}

	async rejectQuotation(
		id: string,
		userId: string,
		dto: RejectQuotationRequestDto,
	) {
		const quotation = await this.quotationRepository.findById(id);
		if (!quotation) {
			throw new HttpNotFoundError(ErrorCode.QUOTATION_NOT_FOUND);
		}
		if (quotation.receiverUserId !== userId) {
			throw new HttpForbiddenError(ErrorCode.QUOTATION_FORBIDDEN);
		}
		if (quotation.status !== QuotationStatus.PENDING) {
			throw new HttpBadRequestError(ErrorCode.QUOTATION_NOT_PENDING);
		}

		await this.quotationRepository.update(id, {
			status: QuotationStatus.REJECTED,
			rejectionNote: dto.rejectionNote ?? null,
			rejectedAt: new Date(),
		} as any);

		this.sendNotification(
			quotation.senderUserId,
			userId,
			NotifType.QUOTATION_REJECTED,
			'quotation',
			quotation.id,
			'Quotation rejected',
			'Your quotation was not accepted.',
			`/quotations/${quotation.id}`,
		).catch(() => {});

		return this.findOne(id, userId);
	}

	async withdrawQuotation(id: string, userId: string) {
		const quotation = await this.quotationRepository.findById(id);
		if (!quotation) {
			throw new HttpNotFoundError(ErrorCode.QUOTATION_NOT_FOUND);
		}
		if (quotation.senderUserId !== userId) {
			throw new HttpForbiddenError(ErrorCode.QUOTATION_FORBIDDEN);
		}
		if (quotation.status !== QuotationStatus.PENDING) {
			throw new HttpBadRequestError(ErrorCode.QUOTATION_NOT_PENDING);
		}

		await this.quotationRepository.update(id, {
			status: QuotationStatus.WITHDRAWN,
		} as any);

		return this.findOne(id, userId);
	}

	private async getOrCreateDirectConversation(
		userAId: string,
		userBId: string,
	): Promise<Conversation> {
		const existing = await this.conversationRepository.findDirectConversation(
			userAId,
			userBId,
		);
		if (existing) return existing;

		return this.conversationRepository.executeInTransaction(async (manager) => {
			const conversation = await manager.save(
				manager.create(Conversation, {
					conversationType: ConversationType.DIRECT,
				}),
			);
			await manager.save(ConversationMember, [
				manager.create(ConversationMember, {
					conversationId: conversation.id,
					userId: userAId,
				}),
				manager.create(ConversationMember, {
					conversationId: conversation.id,
					userId: userBId,
				}),
			]);
			return conversation;
		});
	}

	private async sendNotification(
		recipientId: string,
		actorId: string,
		notifType: NotifType,
		entityType: string,
		entityId: string,
		title: string,
		body: string,
		deepLink: string,
	) {
		try {
			await this.notificationRepository.create({
				recipientId,
				actorId,
				notifType,
				entityType,
				entityId,
				title,
				body,
				deepLink,
				isRead: false,
			});
			this.notifQueue
				.add(SEND_PUSH_JOB, { userId: recipientId, title, body })
				.catch((err) =>
					this.logger.error('Failed to enqueue push notification', err),
				);
		} catch (err) {
			this.logger.error('Failed to send quotation notification', err);
		}
	}

	private mapQuotation(q: any) {
		return {
			id: q.id,
			tradePostId: q.tradePostId,
			productId: q.productId,
			offeredPrice: q.offeredPrice,
			priceUnit: q.priceUnit,
			quantity: q.quantity,
			quantityUnit: q.quantityUnit,
			deliveryTerms: q.deliveryTerms,
			notes: q.notes,
			status: q.status,
			rejectionNote: q.rejectionNote,
			acceptedAt: q.acceptedAt,
			rejectedAt: q.rejectedAt,
			validUntil: q.validUntil,
			expiresAt: q.expiresAt,
			createdAt: q.createdAt,
			sender: {
				id: q.sender.id,
				username: q.sender.username,
				displayName: q.sender.profile?.displayName ?? null,
				avatarUrl: q.sender.profile?.avatarMedia?.cdnUrl ?? null,
			},
			receiver: {
				id: q.receiver.id,
				username: q.receiver.username,
				displayName: q.receiver.profile?.displayName ?? null,
				avatarUrl: q.receiver.profile?.avatarMedia?.cdnUrl ?? null,
			},
		};
	}
}
