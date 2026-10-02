import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import { In } from 'typeorm';
import { FcmDeviceRepository } from '@app/database/typeorm/repositories/fcm-device.repository';

export interface FcmPayload {
	title: string;
	body: string;
	data?: Record<string, string>;
}

@Injectable()
export class FcmService implements OnModuleInit {
	private readonly logger = new Logger(FcmService.name);
	private app: App | null = null;

	constructor(private readonly fcmDeviceRepository: FcmDeviceRepository) {}

	onModuleInit() {
		const projectId = process.env.FIREBASE_PROJECT_ID;
		const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
		const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

		if (!projectId || !clientEmail || !privateKey) {
			this.logger.warn(
				'Firebase credentials not configured — push notifications disabled',
			);
			return;
		}

		const existingApps = getApps();
		this.app =
			existingApps.length > 0
				? existingApps[0]
				: initializeApp({
						credential: cert({ projectId, clientEmail, privateKey }),
					});

		this.logger.log('Firebase Admin SDK initialized');
	}

	async sendToUser(userId: string, payload: FcmPayload): Promise<void> {
		if (!this.app) return;

		const devices = await this.fcmDeviceRepository.findAll({
			where: { userId, isActive: true },
		});
		if (devices.length === 0) return;

		const tokens = devices.map((d) => d.fcmToken);

		try {
			const response = await getMessaging(this.app).sendEachForMulticast({
				tokens,
				notification: { title: payload.title, body: payload.body },
				data: payload.data ?? {},
			});

			const invalidTokens: string[] = [];
			response.responses.forEach((resp, idx) => {
				if (
					!resp.success &&
					resp.error?.code === 'messaging/registration-token-not-registered'
				) {
					invalidTokens.push(tokens[idx]);
				}
			});

			if (invalidTokens.length > 0) {
				void this.deactivateInvalidTokens(invalidTokens);
			}
		} catch (error) {
			this.logger.error(`Failed to send FCM push to user ${userId}`, error);
		}
	}

	private async deactivateInvalidTokens(tokens: string[]): Promise<void> {
		try {
			await this.fcmDeviceRepository.bulkUpdate(
				{ fcmToken: In(tokens) },
				{ isActive: false },
			);
		} catch (error) {
			this.logger.error('Failed to deactivate invalid FCM tokens', error);
		}
	}
}
