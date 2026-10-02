/**
 * @file 403 HttpForbidden error
 * @module error/forbidden
 */

import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * @class HttpForbiddenError
 * @classdesc 403 -> forbidden
 * @example new HttpForbiddenError('error message')
 * @example new HttpForbiddenError(new Error())
 */
export class HttpForbiddenError extends HttpException {
	constructor(error?: any) {
		super(error || 'Permission denied', HttpStatus.FORBIDDEN);
	}
}
