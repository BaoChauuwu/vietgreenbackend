import { HttpException, HttpStatus } from '@nestjs/common';

export class HttpConflictError extends HttpException {
	constructor(error?: any) {
		super(error || 'Conflict', HttpStatus.CONFLICT);
	}
}
