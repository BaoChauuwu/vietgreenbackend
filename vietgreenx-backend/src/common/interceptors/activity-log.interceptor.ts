import {
	CallHandler,
	ExecutionContext,
	Injectable,
	NestInterceptor,
	Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request } from 'express';
import { ActivityLogService } from '@app/modules/activity-log/activity-log.service';
import {
	LOG_ACTIVITY_KEY,
	LogActivityOptions,
} from '@app/common/decorators/activity-log.decorator';
import { sanitizeData } from '@app/common/utils/sanitize.util';

@Injectable()
export class ActivityLogInterceptor implements NestInterceptor {
	private readonly logger = new Logger(ActivityLogInterceptor.name);

	constructor(
		private readonly reflector: Reflector,
		private readonly activityLogService: ActivityLogService,
	) {}

	intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
		const request = context.switchToHttp().getRequest<Request>();
		const activityOptions =
			this.reflector.getAllAndOverride<LogActivityOptions>(LOG_ACTIVITY_KEY, [
				context.getClass(),
				context.getHandler(),
			]);

		const method = request.method;
		const ignoredMethods = ['GET', 'HEAD', 'OPTIONS'];
		const isMutatingMethod = !ignoredMethods.includes(method);

		const shouldLog = !!activityOptions || isMutatingMethod;

		if (!shouldLog) {
			return next.handle();
		}

		return next.handle().pipe(
			tap((resData) => {
				try {
					const user = request['user'];

					let action = activityOptions?.action;
					if (!action) {
						action = `${request.method} ${request.route?.path || request.url}`;
					}

					let entityType = activityOptions?.entityType || null;
					if (!entityType) {
						const pathSegments =
							(request.route?.path || request.url)
								?.split('/')
								.filter(Boolean) || [];
						const anchorIndex = pathSegments.findIndex(
							(s) => s === 'app' || s === 'admin',
						);
						if (anchorIndex !== -1 && pathSegments[anchorIndex + 1]) {
							const segment = pathSegments[anchorIndex + 1];
							entityType = segment.charAt(0).toUpperCase() + segment.slice(1);
						}
					}

					let entityId: string | null = null;
					if (activityOptions?.entityIdParam) {
						entityId = request.params[activityOptions.entityIdParam];
					} else if (request.params.id) {
						entityId = request.params.id;
					} else if (request.body && typeof request.body === 'object') {
						const bodyId = (request.body as Record<string, unknown>).id;
						if (typeof bodyId === 'string') entityId = bodyId;
					} else if (request.query && typeof request.query === 'object') {
						const queryId = (request.query as Record<string, unknown>).id;
						if (typeof queryId === 'string') entityId = queryId;
					}

					if (!entityId && resData && typeof resData === 'object') {
						entityId = resData.id || resData.data?.id || null;
					}

					const metadata = {
						params: sanitizeData(request.params),
						query: sanitizeData(request.query),
						body: sanitizeData(request.body),
					};

					this.activityLogService.log(request, {
						userId: user?.id || null,
						action,
						entityType: entityType,
						entityId: this.isValidUuid(entityId) ? entityId : null,
						metadata,
					});
				} catch (err) {
					this.logger.error(
						'Error in ActivityLogInterceptor:',
						err instanceof Error ? err.stack : err,
					);
				}
			}),
		);
	}

	private isValidUuid(uuid: string | null | undefined): boolean {
		if (!uuid) return false;
		const uuidRegex =
			/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
		return uuidRegex.test(uuid);
	}
}
