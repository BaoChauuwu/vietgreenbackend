import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class ActivityLogMiddleware implements NestMiddleware {
	use(req: Request, res: Response, next: NextFunction) {
		const ipAddress =
			(req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ||
			req.ip ||
			null;
		const userAgent = req.headers['user-agent'] || null;
		const sessionId = (req.headers['x-session-id'] as string) || null;

		req['activityLogContext'] = {
			ipAddress,
			sessionId,
			metadata: {
				userAgent,
			},
		};

		next();
	}
}
