import { Injectable } from '@nestjs/common';
import { BaseRepository } from './base.repository';
import { Message } from '../entities/messaging/message.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

interface LastMessageRow {
	conversationId: string;
	body: string | null;
	senderId: string;
	messageType: string;
	createdAt: Date;
}

interface UnreadCountRow {
	conversationId: string;
	count: string;
}

@Injectable()
export class MessageRepository extends BaseRepository<Message> {
	constructor(
		@InjectRepository(Message)
		private readonly messageRepo: Repository<Message>,
	) {
		super(messageRepo);
	}

	async findLastMessagesForConversations(
		conversationIds: string[],
	): Promise<LastMessageRow[]> {
		if (conversationIds.length === 0) return [];
		return this.messageRepo.query(
			`
			SELECT DISTINCT ON (conversation_id)
			  conversation_id  AS "conversationId",
			  body,
			  sender_id        AS "senderId",
			  message_type     AS "messageType",
			  created_at       AS "createdAt"
			FROM messaging.messages
			WHERE conversation_id = ANY($1::uuid[])
			  AND deleted_at IS NULL
			ORDER BY conversation_id, created_at DESC
			`,
			[conversationIds],
		);
	}

	async unreadCountsForConversations(
		conversationIds: string[],
		userId: string,
	): Promise<UnreadCountRow[]> {
		if (conversationIds.length === 0) return [];
		return this.messageRepo.query(
			`
			SELECT m.conversation_id AS "conversationId", COUNT(*) AS count
			FROM messaging.messages m
			JOIN messaging.conversation_members cm
			  ON cm.conversation_id = m.conversation_id AND cm.user_id = $2
			WHERE m.conversation_id = ANY($1::uuid[])
			  AND m.deleted_at IS NULL
			  AND m.sender_id != $2
			  AND (cm.last_read_at IS NULL OR m.created_at > cm.last_read_at)
			GROUP BY m.conversation_id
			`,
			[conversationIds, userId],
		);
	}
}
