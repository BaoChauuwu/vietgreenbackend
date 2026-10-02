import {
	CallHandler,
	ExecutionContext,
	Injectable,
	NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request } from 'express';
import { AuditLogService } from '@app/modules/audit-log/audit-log.service';
import {
	AUDIT_LOG_KEY,
	AuditOptions,
} from '@app/common/decorators/audit-log.decorator';
import { sanitizeData } from '@app/common/utils/sanitize.util';

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
	constructor(
		private readonly reflector: Reflector,
		private readonly auditLogService: AuditLogService,
	) {}

	intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
		const request = context.switchToHttp().getRequest<Request>();
		const auditOptions = this.reflector.getAllAndOverride<AuditOptions>(
			AUDIT_LOG_KEY,
			[context.getClass(), context.getHandler()],
		);

		const shouldLog = !!auditOptions;

		if (!shouldLog) {
			return next.handle();
		}

		return next.handle().pipe(
			tap(() => {
				try {
					const user = request['user'];

					let action = auditOptions?.action;
					if (!action) {
						action = `${request.method} ${request.route?.path || request.url}`;
					}

					let resourceType = auditOptions?.resourceType || null;
					if (!resourceType) {
						const pathSegments =
							(request.route?.path || request.url)
								?.split('/')
								.filter(Boolean) || [];
						const anchorIndex = pathSegments.findIndex(
							(s) => s === 'app' || s === 'admin',
						);
						if (anchorIndex !== -1 && pathSegments[anchorIndex + 1]) {
							const segment = pathSegments[anchorIndex + 1];
							resourceType = segment.charAt(0).toUpperCase() + segment.slice(1);
						}
					}

					let resourceId: string | null = null;
					if (auditOptions?.resourceIdParam) {
						resourceId = request.params[auditOptions.resourceIdParam];
					} else if (request.params.id) {
						resourceId = request.params.id;
					} else if (request.body && typeof request.body === 'object') {
						const bodyId = (request.body as Record<string, unknown>).id;
						if (typeof bodyId === 'string') resourceId = bodyId;
					} else if (request.query && typeof request.query === 'object') {
						const queryId = (request.query as Record<string, unknown>).id;
						if (typeof queryId === 'string') resourceId = queryId;
					}

					const ipAddress =
						(request.headers['x-forwarded-for'] as string) ||
						request.ip ||
						null;
					const userAgent = request.headers['user-agent'] || null;

					const metadata = {
						params: sanitizeData(request.params),
						query: sanitizeData(request.query),
						body: sanitizeData(request.body),
					};

					this.auditLogService.log({
						userId: user?.id || null,
						actorRole: user?.role || null,
						action,
						resourceType,
						resourceId: this.isValidUuid(resourceId) ? resourceId : null,
						ipAddress,
						userAgent,
						metadata,
					});
				} catch {
					// Audit log failures must not block the request
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
