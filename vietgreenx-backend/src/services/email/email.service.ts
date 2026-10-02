import * as nodemailer from 'nodemailer';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IEmailOptions } from './interfaces/email-options.interface';
import { ConfigKeys } from '@app/config/config-key.enum';

@Injectable()
export class EmailService {
	private transporter: nodemailer.Transporter;
	private clientIsValid: boolean;
	private logger = new Logger('NodeMailer');

	constructor(private readonly configService: ConfigService) {
		this.transporter = nodemailer.createTransport({
			host: configService.get(ConfigKeys.MAIL_HOST),
			port: configService.get(ConfigKeys.MAIL_PORT),
			secure: configService.get(ConfigKeys.MAIL_SECURE),
			auth: {
				user: configService.get(ConfigKeys.MAIL_USER),
				pass: configService.get(ConfigKeys.MAIL_PASSWORD),
			},
		});
		this.verifyClient();
	}

	private verifyClient(): void {
		return this.transporter.verify((error) => {
			if (error) {
				this.clientIsValid = false;
				setTimeout(this.verifyClient.bind(this), 1000 * 60 * 30);
				this.logger.error(
					`Client init failed! retry when after 30 mins,`,
					error?.message || error,
				);
			} else {
				this.clientIsValid = true;
				this.logger.log('client init succeed.');
			}
		});
	}

	public sendMail(mailOptions: IEmailOptions) {
		if (!this.clientIsValid) {
			this.logger.warn('send failed! (init failed)');
			return false;
		}

		this.transporter.sendMail(
			{
				...mailOptions,
				from: `"${this.configService.get(ConfigKeys.MAIL_DEFAULT_NAME)}" <${this.configService.get(ConfigKeys.MAIL_DEFAULT_EMAIL)}>`,
			},
			(error, info) => {
				if (error) {
					this.logger.error(`send failed!`, error?.message || error);
				} else {
					this.logger.log('send succeed.', info.messageId, info.response);
				}
			},
		);
	}
}
