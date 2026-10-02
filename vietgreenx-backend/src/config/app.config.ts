import { registerAs } from '@nestjs/config';
import {
	IsEnum,
	IsInt,
	IsOptional,
	IsString,
	IsUrl,
	Max,
	Min,
} from 'class-validator';
import validateConfig from '@app/utils/validate-config';

export type AppConfig = {
	nodeEnv: string;
	name: string;
	workingDirectory: string;
	frontendDomain?: string;
	backendDomain: string;
	emailLogoUrl?: string;
	port: number;
	apiPrefix: string;
	fallbackLanguage: string;
	headerLanguage: string;
	crossDomain: {
		allowedOrigins: string[];
		allowedReferer: string[];
	};
	timezone: string;
	accountPurgeDays: number;
};

export enum Environment {
	Development = 'development',
	Production = 'production',
	Staging = 'staging',
}

class EnvironmentVariablesValidator {
	@IsEnum(Environment)
	@IsOptional()
	NODE_ENV: Environment;

	@IsInt()
	@Min(0)
	@Max(65535)
	@IsOptional()
	APP_PORT: number;

	@IsUrl({ require_tld: false })
	@IsOptional()
	FRONTEND_DOMAIN: string;

	@IsUrl({ require_tld: false })
	@IsOptional()
	BACKEND_DOMAIN: string;

	@IsString()
	@IsOptional()
	API_PREFIX: string;

	@IsString()
	@IsOptional()
	APP_FALLBACK_LANGUAGE: string;

	@IsString()
	@IsOptional()
	APP_HEADER_LANGUAGE: string;

	@IsString()
	ALLOWED_ORIGINS: string;

	@IsString()
	ALLOWED_REFERER: string;

	@IsString()
	@IsOptional()
	TZ: string;

	@IsUrl({ require_tld: false })
	@IsOptional()
	EMAIL_LOGO_URL: string;

	@IsInt()
	@Min(1)
	@IsOptional()
	ACCOUNT_PURGE_DAYS: number;
}

export default registerAs<AppConfig>('app', () => {
	validateConfig(process.env, EnvironmentVariablesValidator);

	return {
		nodeEnv: process.env['NODE_ENV'] || 'development',
		name: process.env['APP_NAME'] || 'app',
		workingDirectory: process.env['PWD'] || process.cwd(),
		frontendDomain: process.env['FRONTEND_DOMAIN'] ?? 'http://localhost',
		backendDomain: process.env['BACKEND_DOMAIN'] ?? 'http://localhost',
		emailLogoUrl: process.env['EMAIL_LOGO_URL'] || undefined,
		port: process.env['APP_PORT']
			? parseInt(process.env['APP_PORT'], 10)
			: process.env['PORT']
				? parseInt(process.env['PORT'], 10)
				: 3000,
		apiPrefix: process.env['API_PREFIX'] || 'api',
		fallbackLanguage: process.env['APP_FALLBACK_LANGUAGE'] || 'en',
		headerLanguage: process.env['APP_HEADER_LANGUAGE'] || 'x-custom-lang',
		crossDomain: {
			allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || [],
			allowedReferer: process.env.ALLOWED_REFERER?.split(',') || [],
		},
		timezone: process.env.TZ || 'UTC',

		accountPurgeDays: process.env['ACCOUNT_PURGE_DAYS']
			? parseInt(process.env['ACCOUNT_PURGE_DAYS'], 10)
			: 30,
	};
});
