import * as constants from '@nestjs/common/constants';

// responser
export const HTTP_ERROR_CODE = '__customHttpErrorCode__';
export const HTTP_ERROR_MESSAGE = '__customHttpErrorMessage__';

export const HTTP_SUCCESS_CODE = constants.HTTP_CODE_METADATA;
export const HTTP_SUCCESS_MESSAGE = '__customHttpSuccessMessage__';

export const HTTP_RESPONSE_TRANSFORM = '__customHttpResponseTransform__';
export const HTTP_RESPONSE_TRANSFORM_TO_PAGINATE =
	'__customHttpResponseTransformToPaginate__';
