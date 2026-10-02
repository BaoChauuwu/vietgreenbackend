import { registerAs } from '@nestjs/config';
import {
	IsBoolean,
	IsInt,
	IsNotEmpty,
	IsOptional,
	IsString,
	Max,
	Min,
} from 'class-validator';
import validateConfig from '@app/utils/validate-config';

export type DatabaseConfig = {
	type?: string;
	host?: string;
	port?: number;
	password?: string;
	name?: string;
	username?: string;
	synchronize?: boolean;
	maxConnections: number;
	sslEnabled?: boolean;
	rejectUnauthorized?: boolean;
	ca?: string;
	key?: string;
	cert?: string;
};

class EnvironmentVariablesValidator {
	@IsString()
	@IsNotEmpty()
	DATABASE_TYPE: string;

	@IsString()
	@IsNotEmpty()
	DATABASE_HOST: string;

	@IsInt()
	@Min(0)
	@Max(65535)
	@IsNotEmpty()
	DATABASE_PORT: number;

	@IsString()
	@IsNotEmpty()
	DATABASE_PASSWORD: string;

	@IsString()
	@IsNotEmpty()
	DATABASE_NAME: string;

	@IsString()
	@IsNotEmpty()
	DATABASE_USERNAME: string;

	@IsBoolean()
	@IsOptional()
	DATABASE_SYNCHRONIZE: boolean;

	@IsInt()
	@IsOptional()
	DATABASE_MAX_CONNECTIONS: number;

	@IsBoolean()
	@IsOptional()
	DATABASE_SSL_ENABLED: boolean;

	@IsBoolean()
	@IsOptional()
	DATABASE_REJECT_UNAUTHORIZED: boolean;

	@IsString()
	@IsOptional()
	DATABASE_CA: string;

	@IsString()
	@IsOptional()
	DATABASE_KEY: string;

	@IsString()
	@IsOptional()
	DATABASE_CERT: string;
}

export default registerAs<DatabaseConfig>('database', () => {
	validateConfig(process.env, EnvironmentVariablesValidator);

	return {
		type: process.env['DATABASE_TYPE'] || 'postgres',
		host: process.env['DATABASE_HOST'] || '',
		port: process.env['DATABASE_PORT']
			? parseInt(process.env['DATABASE_PORT'], 10)
			: 5432,
		username: process.env['DATABASE_USERNAME'] || '',
		password: process.env['DATABASE_PASSWORD'] || '',
		name: process.env['DATABASE_NAME'] || '',
		synchronize: process.env['DATABASE_SYNCHRONIZE'] === 'true',
		maxConnections: process.env['DATABASE_MAX_CONNECTIONS']
			? parseInt(process.env['DATABASE_MAX_CONNECTIONS'], 10)
			: 100,
		sslEnabled: process.env['DATABASE_SSL_ENABLED'] === 'true',
		rejectUnauthorized: process.env['DATABASE_REJECT_UNAUTHORIZED'] === 'true',
		ca: process.env['DATABASE_CA'] || '',
		key: process.env['DATABASE_KEY'] || '',
		cert: process.env['DATABASE_CERT'] || '',
	};
});
