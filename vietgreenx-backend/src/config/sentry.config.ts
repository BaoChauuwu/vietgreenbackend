import { registerAs } from '@nestjs/config';

export type SentryConfig = {
	dsn?: string;
};

export default registerAs('sentry', (): SentryConfig => {
	return {
		dsn: process.env.SENTRY_DSN || '',
	};
});
