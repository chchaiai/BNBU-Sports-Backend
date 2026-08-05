import { Controller, Get } from '@nestjs/common';

import type { AuthenticatedPrincipal } from '../../common/http/request-context.js';
import { OperationPolicy } from '../../common/policy/operation-policy.decorator.js';
import { CurrentPrincipal } from '../../common/policy/principal.decorator.js';
import { SemestersService, type SemesterProjection } from './semesters.service.js';

@Controller('semesters')
export class SemestersController {
  constructor(private readonly semesters: SemestersService) {}

  @Get('current')
  @OperationPolicy('getCurrentSemester')
  current(@CurrentPrincipal() principal: AuthenticatedPrincipal): Promise<SemesterProjection> {
    return this.semesters.current(principal.organizationId);
  }
}
