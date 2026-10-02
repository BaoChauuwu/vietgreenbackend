/**
 * @file 400 Validation error
 * @module error/validation
 */

import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * @class ValidationError
 * @classdesc 400 -> bad request
 * @example new ValidationError('error message')
 * @example new ValidationError(new Error())
 */
export class ValidationError extends HttpException {
	constructor(error?: any) {
		super(error || 'Invalid params', HttpStatus.BAD_REQUEST);
	}
}
