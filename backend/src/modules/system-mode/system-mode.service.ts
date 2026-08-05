import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../common/database/prisma.service.js';
import { ApplicationError } from '../../common/errors/application-error.js';
import { SYSTEM_MODES, type SystemMode } from '../../common/policy/system-mode-policy.decorator.js';

export interface SystemModeProjection {
  mode: SystemMode;
  policyVersion: number;
  updatedAt: string;
}

@Injectable()
export class SystemModeService {
  constructor(private readonly prisma: PrismaService) {}

  async getForOrganization(organizationId: string): Promise<SystemModeProjection> {
    const policy = await this.prisma.systemPolicy.findUnique({
      where: { organizationId },
      include: { organization: { select: { status: true } } },
    });
    if (policy?.organization.status !== 'ACTIVE') {
      throw new ApplicationError('SYSTEM_SERVICE_UNAVAILABLE', 503);
    }
    return this.project(policy.systemMode, policy.version, policy.updatedAt);
  }

  async getPublic(): Promise<SystemModeProjection> {
    const policies = await this.prisma.systemPolicy.findMany({
      where: { organization: { status: 'ACTIVE' } },
      orderBy: { organizationId: 'asc' },
    });
    if (policies.length === 0 || new Set(policies.map(({ systemMode }) => systemMode)).size !== 1) {
      throw new ApplicationError('SYSTEM_SERVICE_UNAVAILABLE', 503, {
        reason: 'PUBLIC_SYSTEM_MODE_SCOPE_UNAVAILABLE',
      });
    }
    const policy = policies[0];
    if (policy === undefined) throw new ApplicationError('SYSTEM_SERVICE_UNAVAILABLE', 503);
    const policyVersion = Math.max(...policies.map(({ version }) => version));
    const updatedAt = new Date(
      Math.max(...policies.map(({ updatedAt: value }) => value.getTime())),
    );
    return this.project(policy.systemMode, policyVersion, updatedAt);
  }

  private project(mode: string, version: number, updatedAt: Date): SystemModeProjection {
    if (!SYSTEM_MODES.includes(mode as SystemMode)) {
      throw new ApplicationError('SYSTEM_SERVICE_UNAVAILABLE', 503, {
        reason: 'UNKNOWN_SYSTEM_MODE',
      });
    }
    return { mode: mode as SystemMode, policyVersion: version, updatedAt: updatedAt.toISOString() };
  }
}
