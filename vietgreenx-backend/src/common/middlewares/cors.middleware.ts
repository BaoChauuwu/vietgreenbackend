import { ConfigService } from '@nestjs/config';
import { Request, Response, NextFunction } from 'express';
import {
	HttpStatus,
	Injectable,
	NestMiddleware,
	RequestMethod,
} from '@nestjs/common';
import { AllConfigType } from '@app/config/config.type';
import { ConfigKeys } from '@app/config/config-key.enum';

@Injectable()
export class CorsMiddleware implements NestMiddleware {
	constructor(private readonly configService: ConfigService<AllConfigType>) {}

	use(request: Request, response: Response, next: NextFunction) {
		const getMethod = (method: number) => RequestMethod[method];
		const origins = request.headers.origin;
		const origin =
			((Array.isArray(origins) ? origins[0] : origins) as string) || '';
		const allowedOrigins = [
			...this.configService.getOrThrow(ConfigKeys.ALLOWED_ORIGINS, {
				infer: true,
			}),
		];
		const allowedMethods = [
			RequestMethod.GET,
			RequestMethod.HEAD,
			RequestMethod.PUT,
			RequestMethod.PATCH,
			RequestMethod.POST,
			RequestMethod.DELETE,
		];
		const allowedHeaders = [
			'Authorization',
			'Origin',
			'No-Cache',
			'X-Requested-With',
			'If-Modified-Since',
			'Pragma',
			'Last-Modified',
			'Cache-Control',
			'Expires',
			'Content-Type',
			'X-E4M-With',
			'Sentry-Trace',
			'Baggage',
			'Session-Id',
		];

		// Allow Origin — checked against explicit allowlist only.
		// Use ALLOWED_ORIGINS=* in local .env if open CORS is needed for development.
		if (!origin || allowedOrigins.includes(origin)) {
			response.setHeader('Access-Control-Allow-Origin', origin || '*');
		}

		// Headers
		response.header('Access-Control-Allow-Credentials', 'true');
		response.header('Access-Control-Allow-Headers', allowedHeaders.join(','));
		response.header(
			'Access-Control-Allow-Methods',
			allowedMethods.map(getMethod).join(','),
		);
		response.header('Access-Control-Max-Age', '1728000');
		response.header('Content-Type', 'application/json; charset=utf-8');
		// X-Powered-By intentionally omitted — Helmet removes it; re-adding leaks app info.

		// OPTIONS Request
		if (request.method === getMethod(RequestMethod.OPTIONS)) {
			return response.sendStatus(HttpStatus.NO_CONTENT);
		} else {
			return next();
		}
	}
}
