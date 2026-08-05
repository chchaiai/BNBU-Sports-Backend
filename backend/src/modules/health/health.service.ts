import { Injectable } from '@nestjs/common';

import { MigrationCompatibilityService } from '../../common/database/migration-compatibility.service.js';
import { ApplicationError } from '../../common/errors/application-error.js';
import { JsonLoggerService } from '../../common/logging/json-logger.service.js';
import { Clock } from '../../common/time/clock.js';

export interface HealthStatus {
  kind: 'LIVE' | 'READY';
  status: 'UP';
  checkedAt: string;
}

@Injectable()
export class HealthService {
  constructor(
    private readonly migrations: MigrationCompatibilityService,
    private readonly clock: Clock,
    private readonly logger: JsonLoggerService,
  ) {}

  live(): HealthStatus {
    return { kind: 'LIVE', status: 'UP', checkedAt: this.clock.now().toISOString() };
  }

  async ready(): Promise<HealthStatus> {
    const compatibility = await this.migrations.check();
    if (!compatibility.compatible) {
      this.logger.warn({ readiness: compatibility.reason }, HealthService.name);
      throw new ApplicationError('SYSTEM_SERVICE_UNAVAILABLE', 503);
    }
    return { kind: 'READY', status: 'UP', checkedAt: this.clock.now().toISOString() };
  }
}
