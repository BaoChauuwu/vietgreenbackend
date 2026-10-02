import { Module } from '@nestjs/common';
import { MessageService } from './message.service';
import { MessageController } from './message.controller';
import { ChatGateway } from './chat.gateway';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
	Conversation,
	ConversationMember,
	Media,
	Message,
} from '@app/database/typeorm/entities';
import { BlockModule } from '@app/modules/app/block/block.module';
import { AppAuthModule } from '@app/modules/app/app-auth/app-auth.module';
import { ConversationRepository } from '@app/database/typeorm/repositories/conversation.repository';
import { ConversationMemberRepository } from '@app/database/typeorm/repositories/conversation-member.repository';
import { MessageRepository } from '@app/database/typeorm/repositories/message.repository';
import { MediaRepository } from '@app/database/typeorm/repositories/media.repository';

@Module({
	imports: [
		TypeOrmModule.forFeature([
			Conversation,
			ConversationMember,
			Media,
			Message,
		]),
		AppAuthModule,
		BlockModule,
	],
	controllers: [MessageController],
	providers: [
		MessageService,
		ChatGateway,
		ConversationRepository,
		ConversationMemberRepository,
		MediaRepository,
		MessageRepository,
	],
})
export class MessageModule {}
