/**
 * @file HTTP interface
 * @module interface/http
 */

export type ResponseMessage = string;

export type ResponseMessageObject = {
	message: ResponseMessage;
	error?: any;
	details?: any;
};

export type ExceptionInfo = ResponseMessage | ResponseMessageObject;

// HTTP error
export type HttpResponseError = {
	statusCode: number;
	error: string;
	message: string;
	details?: any;
};

// HTTP success
export type HttpResponseSuccess<T> = {
	statusCode: number;
	message: string;
	data: T;
	pagination?: {
		total: number;
		currentPage: number;
		totalPage: number;
		perPage: number;
	};
};
