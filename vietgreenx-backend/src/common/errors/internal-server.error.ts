import { HttpException, HttpStatus } from '@nestjs/common';

export class HttpInternalServerError extends HttpException {
	constructor(error?: any) {
		super(error || 'Unknown error', HttpStatus.INTERNAL_SERVER_ERROR);
	}
}
