import { ConfigService } from '@nestjs/config';
import { Request, Response, NextFunction } from 'express';
import { HttpStatus, Injectable, NestMiddleware } from '@nestjs/common';
import { HttpResponseError } from '@app/common/interfaces/response.interface';
import * as TEXT from '@app/common/constants/text.constant';
import { AllConfigType } from '@app/config/config.type';

@Injectable()
export class OriginMiddleware implements NestMiddleware {
	constructor(private configService: ConfigService<AllConfigType>) {}

	use(request: Request, response: Response, next: NextFunction) {
		// production only
		if (
			this.configService.get('app.nodeEnv', { infer: true }) === 'production'
		) {
			const { origin, referer } = request.headers;
			const allowedReferer =
				this.configService.get('app.crossDomain.allowedReferer', {
					infer: true,
				}) ?? [];
			const isAllowed = (field: string | undefined) =>
				!field ||
				allowedReferer.some((allowed) => {
					if (allowed === '*') return true;
					try {
						const fieldHost = new URL(field).origin;
						const allowedHost = new URL(allowed).origin;
						return fieldHost === allowedHost;
					} catch {
						return field === allowed;
					}
				});

			if (!allowedReferer.length || allowedReferer.includes('*')) {
				return next();
			}

			const isAllowedOrigin = isAllowed(origin);
			const isAllowedReferer = isAllowed(referer);

			if (!isAllowedOrigin && !isAllowedReferer) {
				return response.status(HttpStatus.UNAUTHORIZED).json({
					statusCode: HttpStatus.UNAUTHORIZED,
					error: 'UNAUTHORIZED',
					message: TEXT.HTTP_ANONYMOUS_TEXT,
				} as HttpResponseError);
			}
		}

		return next();
	}
}
