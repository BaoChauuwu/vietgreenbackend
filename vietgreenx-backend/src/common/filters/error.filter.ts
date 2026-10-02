import * as Sentry from '@sentry/node';
import * as lodash from 'lodash';
import { ConfigService } from '@nestjs/config';
import {
	ArgumentsHost,
	Catch,
	ExceptionFilter,
	HttpException,
	HttpStatus,
} from '@nestjs/common';
import {
	ExceptionInfo,
	HttpResponseError,
} from '@app/common/interfaces/response.interface';
import { INTERNAL_SERVER_ERROR } from '../constants/text.constant';
import { ErrorCode } from '@app/common/errors/error-code';
import { ValidationError } from '@app/common/errors/validation.error';

// Reverse map: enum value → enum key  (e.g. 'User not found' → 'USER_NOT_FOUND')
const ERROR_VALUE_TO_KEY = Object.fromEntries(
	Object.entries(ErrorCode).map(([k, v]) => [v, k]),
) as Record<string, string>;

/**
 * @class HttpExceptionFilter
 * @classdesc catch globally exceptions & formatting error message to <HttpErrorResponse>
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
	constructor(private readonly configService: ConfigService) {}

	catch(exception: HttpException, host: ArgumentsHost) {
		const request = host.switchToHttp().getRequest();
		const response = host.switchToHttp().getResponse();

		const exceptionStatus =
			exception instanceof HttpException
				? exception.getStatus()
				: HttpStatus.INTERNAL_SERVER_ERROR;

		if (exceptionStatus >= 500) {
			const sensitiveFields = [
				'password',
				'newPassword',
				'oldPassword',
				'otp',
				'token',
				'refreshToken',
			];
			const sanitizedBody = { ...request.body };
			for (const field of sensitiveFields) {
				if (sanitizedBody[field]) sanitizedBody[field] = '******';
			}

			Sentry.withScope((scope) => {
				scope.setTag('method', request.method);
				scope.setTag('url', request.url);

				scope.setContext('request', {
					body: sanitizedBody,
					query: request.query,
					params: request.params,
				});

				Sentry.captureException(exception);
			});
		}

		const errorResponse =
			exception instanceof HttpException
				? (exception.getResponse() as ExceptionInfo)
				: { message: INTERNAL_SERVER_ERROR, error: exception };

		const errorMessage = lodash.isString(errorResponse)
			? errorResponse
			: errorResponse.message;
		const errorInfo = lodash.isString(errorResponse)
			? errorMessage
			: errorResponse.error;

		// ── Resolve human-readable message ───────────────────────────────────
		let messageString: string;
		if (exceptionStatus >= HttpStatus.INTERNAL_SERVER_ERROR) {
			messageString = 'An unexpected error occurred';
		} else if (errorInfo instanceof HttpException) {
			const innerResponse = errorInfo.getResponse();
			messageString = lodash.isString(innerResponse)
				? innerResponse
				: ((innerResponse as Record<string, any>)?.message ??
					errorInfo.message);
		} else {
			messageString =
				errorInfo?.message ||
				(lodash.isString(errorInfo) ? errorInfo : JSON.stringify(errorInfo));
		}

		// ── Resolve machine-readable error code ───────────────────────────────
		let errorCode: string;
		if (exceptionStatus >= HttpStatus.INTERNAL_SERVER_ERROR) {
			errorCode = 'INTERNAL_SERVER_ERROR';
		} else if (exception instanceof ValidationError) {
			errorCode = 'VALIDATION_ERROR';
		} else {
			errorCode = ERROR_VALUE_TO_KEY[messageString] ?? messageString;
		}

		// ── Build response ────────────────────────────────────────────────────
		const data: HttpResponseError = {
			statusCode: exceptionStatus,
			error: errorCode,
			message: messageString,
		};

		// Propagate structured details from HttpBadRequestErrorWithEntity
		if (errorInfo instanceof HttpException) {
			const innerResponse = errorInfo.getResponse() as Record<string, any>;
			if (innerResponse?.details) {
				data.details = innerResponse.details;
			}
		}

		return response.status(exceptionStatus).json(data);
	}
}
