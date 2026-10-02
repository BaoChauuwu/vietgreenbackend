import { Module, Global } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ActivityLogProcessor } from './activity-log.processor';
import { ActivityLogService } from './activity-log.service';

@Global()
@Module({
	imports: [
		BullModule.registerQueue({
			name: 'activity-log',
		}),
	],
	providers: [ActivityLogService, ActivityLogProcessor],
	exports: [ActivityLogService],
})
export class ActivityLogModule {}
