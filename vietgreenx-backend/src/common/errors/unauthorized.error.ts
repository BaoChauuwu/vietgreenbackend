/**
 * @file 401 HttpUnauthorized error
 * @module error/unauthorized
 */

import { UnauthorizedException } from '@nestjs/common';

/**
 * @class HttpUnauthorizedError
 * @classdesc 401 -> unauthorized
 * @example new HttpUnauthorizedError('unauthorized')
 * @example new HttpUnauthorizedError('error message', new Error())
 */
export class HttpUnauthorizedError extends UnauthorizedException {
	constructor(message?: string, error?: any) {
		super(message || 'Unauthorized', error);
	}
}
