import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from './base.repository';
import { ConversationMember } from '../entities/messaging/conversation-member.entity';

@Injectable()
export class ConversationMemberRepository extends BaseRepository<ConversationMember> {
	constructor(
		@InjectRepository(ConversationMember)
		private readonly repo: Repository<ConversationMember>,
	) {
		super(repo);
	}
}
