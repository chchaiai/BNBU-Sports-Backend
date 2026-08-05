import {
  ArgumentsHost,
  Catch,
  HttpException,
  Injectable,
  type ExceptionFilter,
} from '@nestjs/common';
import type { Response } from 'express';

import { Clock } from '../time/clock.js';
import type { FoundationRequest } from '../http/request-context.js';
import { ApplicationError } from './application-error.js';

@Catch()
@Injectable()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private readonly clock: Clock) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const request = http.getRequest<FoundationRequest>();
    const response = http.getResponse<Response>();
    const error = this.map(exception);

    response.status(error.status).json({
      code: error.code,
      message: error.message,
      details: error.details,
      requestId: request.requestId,
      timestamp: this.clock.now().toISOString(),
    });
  }

  private map(exception: unknown): ApplicationError {
    if (exception instanceof ApplicationError) return exception;

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      if (status === 404) return new ApplicationError('PERMISSION_RESOURCE_NOT_FOUND', 404);
      if (status === 401) return new ApplicationError('AUTH_REQUIRED', 401);
      if (status === 403) return new ApplicationError('PERMISSION_RESOURCE_SCOPE_DENIED', 403);
      if (status >= 400 && status < 500) return new ApplicationError('VALIDATION_FAILED', 422);
    }

    return new ApplicationError('SYSTEM_INTERNAL_ERROR', 500);
  }
}
