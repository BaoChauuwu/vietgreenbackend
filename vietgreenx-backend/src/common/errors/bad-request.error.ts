/**
 * @file 400 HttpBadRequest error
 * @module error/bad-request
 */

import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * @class HttpBadRequestError
 * @classdesc 400 -> bad request
 * @example new HttpBadRequestError('error message')
 * @example new HttpBadRequestError(new Error())
 */
export class HttpBadRequestError extends HttpException {
	constructor(error?: any) {
		super(error || 'Unknown error', HttpStatus.BAD_REQUEST);
	}
}
export class HttpBadRequestErrorWithEntity extends HttpException {
	constructor(errorCode: string, details?: any) {
		super(
			{
				errorCode,
				message: errorCode || 'Bad request',
				details: details as Record<string, any>,
			},
			HttpStatus.BAD_REQUEST,
		);
	}
}
