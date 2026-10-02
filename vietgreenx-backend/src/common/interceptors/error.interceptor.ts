/**
 * @file Error interceptor
 * @module interceptor/error
 */

import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import {
	CallHandler,
	ExecutionContext,
	HttpException,
	HttpStatus,
	Injectable,
	Logger,
	NestInterceptor,
} from '@nestjs/common';
import { getResponserOptions } from '@app/common/decorators/responser.decorator';
import * as TEXT from '@app/common/constants/text.constant';
import {
	CustomError,
	HttpBadRequestError,
	HttpConflictError,
	HttpForbiddenError,
	HttpNotFoundError,
	HttpUnauthorizedError,
	ValidationError,
} from '@app/common/errors';

/**
 * @class ErrorInterceptor
 * @classdesc catch error when controller Promise rejected
 */
@Injectable()
export class ErrorInterceptor implements NestInterceptor {
	private readonly logger = new Logger(ErrorInterceptor.name);

	isInternalException(error) {
		return ![
			ValidationError.name,
			HttpBadRequestError.name,
			HttpConflictError.name,
			HttpForbiddenError.name,
			HttpNotFoundError.name,
			HttpUnauthorizedError.name,
		].includes(error.name);
	}

	logRequestError(request, error) {
		const ignoreStatuses = [
			HttpStatus.NOT_FOUND,
			HttpStatus.UNAUTHORIZED,
			HttpStatus.FORBIDDEN,
			HttpStatus.BAD_REQUEST,
		];
		const ignoreMessages = [
			'Incorrect username or password',
			'Invalid Refresh Token',
			'Refresh Token has expired',
		];
		if (error?.status && ignoreStatuses.includes(error.status)) {
			return;
		}
		for (const message of ignoreMessages) {
			if (error?.message?.toLowerCase().includes(message.toLowerCase())) {
				return;
			}
		}
		const body = { ...request.body };
		const privateFields = [
			'password',
			'newPassword',
			'oldPassword',
			'otp',
			'token',
			'refreshToken',
			'twoFactorSecret',
			'backupCode',
		];
		for (const field of privateFields) {
			if (body[field]) {
				body[field] = '******';
			}
		}
		const message = `${request.method} ${request.url}\nBody: ${JSON.stringify(body)}\nError: ${error.stack || error.message}`;
		this.logger.error(message);
	}

	intercept(
		context: ExecutionContext,
		next: CallHandler<any>,
	): Observable<any> {
		const call$ = next.handle();
		const target = context.getHandler();
		const { errorCode, errorMessage } = getResponserOptions(target);
		const request = context.switchToHttp().getRequest<Request>();
		return call$.pipe(
			catchError((error) => {
				if (this.isInternalException(error)) {
					this.logRequestError(request, error);
				}

				return throwError(
					() =>
						new CustomError(
							{ message: errorMessage || TEXT.HTTP_DEFAULT_ERROR_TEXT, error },
							error instanceof HttpException ? error.getStatus() : errorCode,
						),
				);
			}),
		);
	}
}
