/**
 * @file 400 HttpBadRequest error
 * @module error/bad-request
 */

import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * @class HttpBadRequestError
 * @classdesc 404 -> bad request
 * @example new HttpNotFoundError('error message')
 * @example new HttpNotFoundError(new Error())
 */
export class HttpNotFoundError extends HttpException {
	constructor(error?: any) {
		super(error || 'Unknown error', HttpStatus.NOT_FOUND);
	}
}
