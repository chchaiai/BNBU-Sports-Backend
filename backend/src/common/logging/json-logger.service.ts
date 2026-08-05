import { Inject, Injectable, type LoggerService } from '@nestjs/common';
import pino, { type Logger } from 'pino';

import type { RuntimeConfig } from '../config/environment.js';
import { RUNTIME_CONFIG } from '../config/runtime-config.module.js';
import { redactSensitive } from './redaction.js';

interface HttpLog {
  requestId: string;
  traceId?: string;
  operationId?: string;
  permissionId?: string;
  actorUserId?: string;
  organizationId?: string;
  method: string;
  path: string;
  statusCode: number;
  durationMs: number;
  errorCode?: string;
  outcome: 'SUCCEEDED' | 'FAILED';
}

@Injectable()
export class JsonLoggerService implements LoggerService {
  private readonly logger: Logger;

  constructor(@Inject(RUNTIME_CONFIG) config: RuntimeConfig) {
    this.logger = pino({
      level: config.logLevel,
      base: {
        service: 'bnbu-sports-backend',
        environment: config.appEnvironment,
        version: config.appVersion,
      },
      timestamp: pino.stdTimeFunctions.isoTime,
    });
  }

  log(message: unknown, context?: string): void {
    this.logger.info({ context, payload: redactSensitive(message) });
  }

  error(message: unknown, _trace?: string, context?: string): void {
    this.logger.error({ context, payload: redactSensitive(message) });
  }

  warn(message: unknown, context?: string): void {
    this.logger.warn({ context, payload: redactSensitive(message) });
  }

  debug(message: unknown, context?: string): void {
    this.logger.debug({ context, payload: redactSensitive(message) });
  }

  verbose(message: unknown, context?: string): void {
    this.logger.trace({ context, payload: redactSensitive(message) });
  }

  fatal(message: unknown, context?: string): void {
    this.logger.fatal({ context, payload: redactSensitive(message) });
  }

  http(fields: HttpLog): void {
    this.logger.info(fields, 'http_request_completed');
  }
}
