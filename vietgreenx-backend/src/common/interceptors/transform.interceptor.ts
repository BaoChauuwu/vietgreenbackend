import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
	CallHandler,
	ExecutionContext,
	Injectable,
	NestInterceptor,
} from '@nestjs/common';
import { HttpResponseSuccess } from '@app/common/interfaces/response.interface';
import { getResponserOptions } from '@app/common/decorators/responser.decorator';
import { HTTP_SUCCESS_SUFFIX } from '@app/common/constants/text.constant';

@Injectable()
export class TransformInterceptor<T>
	implements NestInterceptor<T, T | HttpResponseSuccess<T>>
{
	intercept(
		context: ExecutionContext,
		next: CallHandler<T>,
	): Observable<T | HttpResponseSuccess<T>> {
		const call$ = next.handle();
		const target = context.getHandler();
		const { transform, paginate, successMessage } = getResponserOptions(target);
		if (!transform) {
			return call$;
		}

		const statusCode = context.switchToHttp().getResponse().statusCode;
		const message = successMessage
			? successMessage.replace(HTTP_SUCCESS_SUFFIX, '')
			: 'OK';

		return call$.pipe(
			map((data: any) => {
				if (paginate) {
					return {
						statusCode,
						message,
						data: data.items,
						pagination: {
							total: data.total,
							currentPage: data.page,
							totalPage: data.totalPage,
							perPage: data.limit,
						},
					};
				}
				return { statusCode, message, data };
			}),
		);
	}
}
