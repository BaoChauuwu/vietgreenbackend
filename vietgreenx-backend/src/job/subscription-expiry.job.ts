import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { MembershipService } from '@app/modules/app/membership/membership.service';

@Injectable()
export class SubscriptionExpiryJob {
	private readonly logger = new Logger(SubscriptionExpiryJob.name);

	constructor(private readonly membershipService: MembershipService) {}

	@Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
	async handleCron() {
		this.logger.log('Starting Subscription Expiry and Alert Job...');

		try {
			const { expired, notified } =
				await this.membershipService.expirePlansAndNotify();

			this.logger.log(
				`Subscription job complete: ${expired} plans expired, ${notified} pre-expiry notifications sent.`,
			);
		} catch (err) {
			this.logger.error('Subscription expiry job failed', err);
		}
	}
}
