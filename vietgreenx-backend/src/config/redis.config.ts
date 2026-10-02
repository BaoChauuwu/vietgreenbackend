import validateConfig from '@app/utils/validate-config';
import { registerAs } from '@nestjs/config';
import { IsInt, IsNotEmpty, IsString, Max, Min } from 'class-validator';

export type RedisConfig = {
	host: string;
	port: number;
};

class EnvironmentVariablesValidator {
	@IsString()
	@IsNotEmpty()
	REDIS_HOST: string;

	@IsInt()
	@Min(0)
	@Max(65535)
	@IsNotEmpty()
	REDIS_PORT: number;
}

export default registerAs<RedisConfig>('redis', () => {
	validateConfig(process.env, EnvironmentVariablesValidator);

	return {
		host: process.env['REDIS_HOST'] ?? 'localhost',
		port: process.env['REDIS_PORT']
			? parseInt(process.env['REDIS_PORT'], 10)
			: 6379,
	};
});
