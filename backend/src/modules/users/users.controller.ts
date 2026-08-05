import { Body, Controller, Get, Headers, Patch } from '@nestjs/common';

import type { AuthenticatedPrincipal } from '../../common/http/request-context.js';
import { OperationPolicy } from '../../common/policy/operation-policy.decorator.js';
import { CurrentPrincipal } from '../../common/policy/principal.decorator.js';
import { UsersService, type CurrentUserProjection } from './users.service.js';
import { UpdateCurrentProfileRequestDto } from './users.dto.js';

@Controller('me')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  @OperationPolicy('getCurrentUser')
  current(@CurrentPrincipal() principal: AuthenticatedPrincipal): Promise<CurrentUserProjection> {
    return this.users.current(principal);
  }

  @Patch()
  @OperationPolicy('updateCurrentUserProfile')
  update(
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
    @Body() body: UpdateCurrentProfileRequestDto,
    @Headers('idempotency-key') idempotencyKey: string | undefined,
  ): Promise<never> {
    void body;
    void idempotencyKey;
    return this.users.denyCurrentProfileUpdate(principal);
  }
}
