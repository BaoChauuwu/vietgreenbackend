export enum ConfigKeys {
	// App Configurations
	NODE_ENV = 'app.nodeEnv',
	APP_NAME = 'app.name',
	WORKING_DIRECTORY = 'app.workingDirectory',
	FRONTEND_DOMAIN = 'app.frontendDomain',
	BACKEND_DOMAIN = 'app.backendDomain',
	EMAIL_LOGO_URL = 'app.emailLogoUrl',
	APP_PORT = 'app.port',
	API_PREFIX = 'app.apiPrefix',
	FALLBACK_LANGUAGE = 'app.fallbackLanguage',
	HEADER_LANGUAGE = 'app.headerLanguage',
	ALLOWED_ORIGINS = 'app.crossDomain.allowedOrigins',
	ALLOWED_REFERER = 'app.crossDomain.allowedReferer',
	TIMEZONE = 'app.timezone',
	ACCOUNT_PURGE_DAYS = 'app.accountPurgeDays',

	// Redis Configurations
	REDIS_HOST = 'redis.host',
	REDIS_PORT = 'redis.port',

	// Auth Configurations
	JWT_SECRET = 'auth.secret',
	JWT_EXPIRES = 'auth.expires',

	// Database Configurations
	DATABASE_TYPE = 'database.type',
	DATABASE_HOST = 'database.host',
	DATABASE_PORT = 'database.port',
	DATABASE_USERNAME = 'database.username',
	DATABASE_PASSWORD = 'database.password',
	DATABASE_NAME = 'database.name',
	DATABASE_SYNCHRONIZE = 'database.synchronize',
	DATABASE_MAX_CONNECTIONS = 'database.maxConnections',
	DATABASE_SSL_ENABLED = 'database.sslEnabled',
	DATABASE_REJECT_UNAUTHORIZED = 'database.rejectUnauthorized',
	DATABASE_CA = 'database.ca',
	DATABASE_KEY = 'database.key',
	DATABASE_CERT = 'database.cert',

	// Mail Configurations
	MAIL_PORT = 'mail.port',
	MAIL_HOST = 'mail.host',
	MAIL_USER = 'mail.user',
	MAIL_PASSWORD = 'mail.password',
	MAIL_DEFAULT_EMAIL = 'mail.defaultEmail',
	MAIL_DEFAULT_NAME = 'mail.defaultName',
	MAIL_IGNORE_TLS = 'mail.ignoreTLS',
	MAIL_SECURE = 'mail.secure',
	MAIL_REQUIRE_TLS = 'mail.requireTLS',

	// File Configurations
	FILE_DRIVER = 'file.driver',
	ACCESS_KEY_ID = 'file.accessKeyId',
	SECRET_ACCESS_KEY = 'file.secretAccessKey',
	AWS_DEFAULT_S3_BUCKET = 'file.awsDefaultS3Bucket',
	AWS_S3_REGION = 'file.awsS3Region',
	AWS_DEFAULT_S3_URL = 'file.awsDefaultS3Url',

	// Sentry Configurations
	SENTRY_DSN = 'sentry.dsn',

	// QR Quota
	DEFAULT_QR_LIMIT = 'DEFAULT_QR_LIMIT',
}
