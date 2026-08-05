import {
  Injectable,
  type CallHandler,
  type ExecutionContext,
  type NestInterceptor,
} from '@nestjs/common';
import type { Response } from 'express';
import type { Observable } from 'rxjs';
import { finalize, tap } from 'rxjs/operators';

import { ApplicationError } from '../errors/application-error.js';
import type { FoundationRequest } from '../http/request-context.js';
import { operationPolicies } from '../../generated/operation-policies.generated.js';
import { JsonLoggerService } from './json-logger.service.js';

@Injectable()
export class HttpLoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: JsonLoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const startedAt = performance.now();
    const http = context.switchToHttp();
    const request = http.getRequest<FoundationRequest>();
    const response = http.getResponse<Response>();
    let errorCode: string | undefined;

    return next.handle().pipe(
      tap({
        error: (error: unknown) => {
          errorCode = error instanceof ApplicationError ? error.code : 'SYSTEM_INTERNAL_ERROR';
        },
      }),
      finalize(() => {
        this.logger.http({
          requestId: request.requestId,
          ...(request.operationId === undefined ? {} : { operationId: request.operationId }),
          ...(request.permissionId === undefined ? {} : { permissionId: request.permissionId }),
          ...(request.principal === undefined
            ? {}
            : {
                actorUserId: request.principal.userId,
                organizationId: request.principal.organizationId,
              }),
          method: request.method,
          path:
            request.operationId === undefined ||
            !Object.hasOwn(operationPolicies, request.operationId)
              ? '/api/v1/unknown'
              : `/api/v1/${operationPolicies[
                  request.operationId as keyof typeof operationPolicies
                ].route.replace(/^\//, '')}`,
          statusCode: response.statusCode,
          durationMs: Math.round((performance.now() - startedAt) * 100) / 100,
          ...(errorCode === undefined ? {} : { errorCode }),
          outcome: errorCode === undefined ? 'SUCCEEDED' : 'FAILED',
        });
      }),
    );
  }
}
