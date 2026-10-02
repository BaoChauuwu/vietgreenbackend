import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { QuotationController } from './quotation.controller';
import { QuotationService } from './quotation.service';
import { QuotationRepository } from '@app/database/typeorm/repositories/quotation.repository';
import { ConversationRepository } from '@app/database/typeorm/repositories/conversation.repository';
import { NotificationRepository } from '@app/database/typeorm/repositories/notification.repository';
import { TradePostRepository } from '@app/database/typeorm/repositories/trade-post.repository';
import { Quotation } from '@app/database/typeorm/entities/agriculture/quotation.entity';
import { Conversation } from '@app/database/typeorm/entities/messaging/conversation.entity';
import { ConversationMember } from '@app/database/typeorm/entities/messaging/conversation-member.entity';
import { Notification } from '@app/database/typeorm/entities/notification/notification.entity';
import { TradePost } from '@app/database/typeorm/entities/agriculture/trade-post.entity';
import { AppAuthModule } from '@app/modules/app/app-auth/app-auth.module';
import { NOTIFICATION_QUEUE } from '@app/modules/app/notification/notification.queue';

@Module({
	imports: [
		TypeOrmModule.forFeature([
			Quotation,
			Conversation,
			ConversationMember,
			Notification,
			TradePost,
		]),
		AppAuthModule,
		BullModule.registerQueue({ name: NOTIFICATION_QUEUE }),
	],
	controllers: [QuotationController],
	providers: [
		QuotationService,
		QuotationRepository,
		ConversationRepository,
		NotificationRepository,
		TradePostRepository,
	],
})
export class QuotationModule {}
