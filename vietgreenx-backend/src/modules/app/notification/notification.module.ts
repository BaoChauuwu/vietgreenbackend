import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { Notification } from '../../../database/typeorm/entities/notification/notification.entity';
import { User } from '../../../database/typeorm/entities/identity/user.entity';
import { FcmDevice } from '@app/database/typeorm/entities/identity/fcm-device.entity';
import { FcmDeviceRepository } from '@app/database/typeorm/repositories/fcm-device.repository';
import { NotificationRepository } from '../../../database/typeorm/repositories/notification.repository';
import { UserRepository } from '../../../database/typeorm/repositories/user.repository';
import { NotificationService } from './notification.service';
import { NotificationListener } from './notification.listener';
import { BlockModule } from '../block/block.module';
import { NotificationController } from './notification.controller';
import { AppAuthModule } from '../app-auth/app-auth.module';
import { Comment } from '@app/database/typeorm/entities/engagement/comment.entity';
import { CommentRepository } from '@app/database/typeorm/repositories/comment.repository';
import { PostRepository } from '@app/database/typeorm/repositories/post.repository';
import { Post } from '@app/database/typeorm/entities/content/post.entity';
import { NOTIFICATION_QUEUE } from './notification.queue';
import { NotificationPushProcessor } from './notification.processor';

@Module({
	imports: [
		TypeOrmModule.forFeature([Notification, User, Comment, Post, FcmDevice]),
		BlockModule,
		AppAuthModule,
		BullModule.registerQueue({
			name: NOTIFICATION_QUEUE,
			defaultJobOptions: {
				attempts: 3,
				backoff: { type: 'exponential', delay: 1000 },
				removeOnComplete: true,
				removeOnFail: false,
			},
		}),
	],
	controllers: [NotificationController],
	providers: [
		NotificationService,
		NotificationRepository,
		UserRepository,
		NotificationListener,
		CommentRepository,
		PostRepository,
		NotificationPushProcessor,
		FcmDeviceRepository,
	],
	exports: [NotificationService, NotificationRepository],
})
export class NotificationModule {}
