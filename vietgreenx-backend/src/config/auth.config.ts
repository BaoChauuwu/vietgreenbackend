import { registerAs } from '@nestjs/config';
import { IsNotEmpty, IsString } from 'class-validator';
import validateConfig from '@app/utils/validate-config';

export type AuthConfig = {
	secret: string;
	expires: string;
};

class EnvironmentVariablesValidator {
	@IsNotEmpty()
	@IsString()
	AUTH_JWT_SECRET: string;

	@IsNotEmpty()
	@IsString()
	AUTH_JWT_TOKEN_EXPIRES_IN: string;
}

export default registerAs<AuthConfig>('auth', () => {
	validateConfig(process.env, EnvironmentVariablesValidator);

	return {
		secret: process.env['AUTH_JWT_SECRET']!,
		expires: process.env['AUTH_JWT_TOKEN_EXPIRES_IN']!,
	};
});
