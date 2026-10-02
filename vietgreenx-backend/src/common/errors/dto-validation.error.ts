/**
 * @file 400 Validation error
 * @module error/validation
 */

import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * @class HttpDTOValidationError
 * @classdesc 400 -> bad request
 * @example new HttpDTOValidationError('error message')
 * @example new HttpDTOValidationError(new Error())
 */
export class HttpDTOValidationError extends HttpException {
	constructor(error?: any) {
		super(error || 'Invalid params', HttpStatus.BAD_REQUEST);
	}
}
