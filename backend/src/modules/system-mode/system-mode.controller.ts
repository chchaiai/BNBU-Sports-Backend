import { Controller, Get } from '@nestjs/common';

import { OperationPolicy } from '../../common/policy/operation-policy.decorator.js';
import { SystemModeService, type SystemModeProjection } from './system-mode.service.js';

@Controller('system-mode')
export class SystemModeController {
  constructor(private readonly systemMode: SystemModeService) {}

  @Get()
  @OperationPolicy('getSystemMode')
  getSystemMode(): Promise<SystemModeProjection> {
    return this.systemMode.getPublic();
  }
}
