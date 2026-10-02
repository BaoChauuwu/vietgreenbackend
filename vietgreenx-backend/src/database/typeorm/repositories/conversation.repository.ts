import { Injectable } from '@nestjs/common';
import { BaseRepository } from './base.repository';
import { Conversation } from '../entities/messaging/conversation.entity';
import { ConversationMember } from '../entities/messaging/conversation-member.entity';
import { ConversationType } from '@app/common/enums/conversation-type.enum';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class ConversationRepository extends BaseRepository<Conversation> {
	constructor(
		@InjectRepository(Conversation)
		private readonly conversationRepo: Repository<Conversation>,
	) {
		super(conversationRepo);
	}

	async findDirectConversation(userId: string, targetUserId: string): Promise<Conversation | null> {
		return await this.createQueryBuilder('c')
			.innerJoin(ConversationMember, 'cm1', 'c.id = cm1.conversationId AND cm1.userId = :userId', { userId })
			.innerJoin(ConversationMember, 'cm2', 'c.id = cm2.conversationId AND cm2.userId = :targetUserId', { targetUserId })
			.where('c.conversationType = :type', { type: ConversationType.DIRECT })
			.getOne();
	}
}
