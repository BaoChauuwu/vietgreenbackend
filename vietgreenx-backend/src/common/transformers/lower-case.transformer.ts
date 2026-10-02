import { TransformFnParams } from 'class-transformer';
import { MaybeType } from '@app/common/types/maybe.type';

export const lowerCaseTransformer = (
	params: TransformFnParams,
): MaybeType<string> => params.value?.toLowerCase().trim();
