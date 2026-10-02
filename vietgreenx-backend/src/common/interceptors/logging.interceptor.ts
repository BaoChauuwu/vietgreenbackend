/**
 * @file Dev logging interceptor
 * @module interceptor/logging
 */

import { Request } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import {
	CallHandler,
	ExecutionContext,
	Injectable,
	Logger,
	NestInterceptor,
} from '@nestjs/common';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
	private readonly logger = new Logger(LoggingInterceptor.name);

	intercept(
		context: ExecutionContext,
		next: CallHandler<any>,
	): Observable<any> {
		const call$ = next.handle();
		const request = context.switchToHttp().getRequest<Request>();
		const content = request.method + ' -> ' + request.url;
		const now = Date.now();
		return call$.pipe(
			tap(() => this.logger.debug(`${content} ${Date.now() - now}ms`)),
		);
	}
}
