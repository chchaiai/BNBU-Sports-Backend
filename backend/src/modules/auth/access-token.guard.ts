import { CanActivate, ExecutionContext, Injectable, Optional } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { PrismaService } from '../../common/database/prisma.service.js';
import { ApplicationError } from '../../common/errors/application-error.js';
import {
  USER_ROLES,
  type FoundationRequest,
  type UserRole,
} from '../../common/http/request-context.js';
import { OPERATION_ID_METADATA } from '../../common/policy/operation-policy.decorator.js';
import { QrJoinPolicyResolver } from '../../common/policy/qr-join-policy-resolver.js';
import { Clock } from '../../common/time/clock.js';
import {
  operationPolicies,
  type OperationId,
} from '../../generated/operation-policies.generated.js';
import { TokenService } from './token.service.js';

const PENDING_CONTACT_ALLOWED_OPERATIONS = new Set<OperationId>([
  'getCurrentUser',
  'requestCurrentUserEmailChallenge',
  'verifyCurrentUserEmailChallenge',
  'logoutSession',
]);

@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly tokens: TokenService,
    private readonly prisma: PrismaService,
    private readonly clock: Clock,
    @Optional() private readonly qrJoinPolicy?: QrJoinPolicyResolver,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const operationId = this.reflector.getAllAndOverride<OperationId>(OPERATION_ID_METADATA, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (operationId === undefined) {
      throw new ApplicationError('SYSTEM_DATA_INTEGRITY_ERROR', 500, {
        invariant: 'OPERATION_POLICY_METADATA_REQUIRED',
      });
    }
    if (!Object.hasOwn(operationPolicies, operationId)) {
      throw new ApplicationError('SYSTEM_DATA_INTEGRITY_ERROR', 500, {
        invariant: 'OPERATION_POLICY_UNKNOWN',
      });
    }
    const policy = operationPolicies[operationId];
    const request = context.switchToHttp().getRequest<FoundationRequest>();
    if (policy.authentication === 'PUBLIC') return true;
    if (policy.authentication === 'JOIN_CAPABILITY') {
      if (this.qrJoinPolicy === undefined) {
        throw new ApplicationError('SYSTEM_DATA_INTEGRITY_ERROR', 500, {
          invariant: 'QR_JOIN_POLICY_RESOLVER_REQUIRED',
        });
      }
      if (request.headers.authorization !== undefined) {
        throw new ApplicationError('AUTH_TOKEN_INVALID', 401);
      }
      const joinCapability = request.headers['x-join-capability'];
      const inviteToken = request.params.inviteToken;
      if (
        typeof joinCapability !== 'string' ||
        joinCapability.length === 0 ||
        typeof inviteToken !== 'string' ||
        inviteToken.length === 0
      ) {
        throw new ApplicationError('AUTH_JOIN_CAPABILITY_INVALID', 401);
      }
      const capability = await this.qrJoinPolicy.resolveCapability({
        inviteToken,
        joinCapability,
        sourceIp: request.ip,
      });
      request.capabilityContext = capability;
      request.inviteContext = capability.invite;
      request.resourceOrganizationId = capability.organizationId;
      return true;
    }
    if (policy.authentication !== 'ACCESS_TOKEN') {
      throw new ApplicationError('SYSTEM_DATA_INTEGRITY_ERROR', 500, {
        invariant: 'AUTHENTICATION_POLICY_UNSUPPORTED',
        operationId,
      });
    }

    const authorization = request.headers.authorization;
    if (typeof authorization !== 'string') throw new ApplicationError('AUTH_REQUIRED', 401);
    const match = /^Bearer ([^\s]+)$/.exec(authorization);
    if (match?.[1] === undefined) throw new ApplicationError('AUTH_TOKEN_INVALID', 401);

    const principal = await this.tokens.verify(match[1]);
    const session = await this.prisma.authSession.findUnique({
      where: { id: principal.sessionId },
      include: { user: true, organization: true },
    });
    if (
      session?.organizationId !== principal.organizationId ||
      session?.userId !== principal.userId ||
      session?.user.organizationId !== principal.organizationId ||
      session?.organization.id !== principal.organizationId
    ) {
      throw new ApplicationError('AUTH_TOKEN_INVALID', 401);
    }
    if (!USER_ROLES.includes(session.user.role as UserRole)) {
      throw new ApplicationError('SYSTEM_DATA_INTEGRITY_ERROR', 500, {
        invariant: 'USER_ROLE_UNSUPPORTED',
      });
    }
    if (
      session.user.role !== principal.role ||
      session.user.tokenVersion !== principal.tokenVersion
    ) {
      throw new ApplicationError('AUTH_SESSION_REVOKED', 401);
    }
    if (
      session.organization.status !== 'ACTIVE' ||
      session.user.deletedAt !== null ||
      session.user.status === 'DISABLED'
    ) {
      throw new ApplicationError('AUTH_ACCOUNT_DISABLED', 403);
    }
    if (session.user.status === 'LOCKED') {
      throw new ApplicationError('AUTH_CREDENTIAL_INVALID', 401);
    }
    if (
      session.user.status === 'PENDING_CONTACT_BINDING' &&
      !PENDING_CONTACT_ALLOWED_OPERATIONS.has(operationId)
    ) {
      throw new ApplicationError('USER_STATUS_NOT_ACTIVE', 409, {
        currentState: session.user.status,
        requiredStatus: 'ACTIVE',
      });
    }
    if (!['PENDING_CONTACT_BINDING', 'ACTIVE'].includes(session.user.status)) {
      throw new ApplicationError('SYSTEM_DATA_INTEGRITY_ERROR', 500, {
        invariant: 'USER_STATUS_UNSUPPORTED',
      });
    }

    const now = this.clock.now();
    if (session.absoluteExpiresAt <= now || session.idleExpiresAt <= now) {
      throw new ApplicationError('AUTH_SESSION_REVOKED', 401);
    }
    const repeatedLogout = operationId === 'logoutSession' && session.status === 'REVOKED';
    if (session.status !== 'ACTIVE' && !repeatedLogout) {
      throw new ApplicationError('AUTH_SESSION_REVOKED', 401);
    }

    request.principal = principal;
    return true;
  }
}
