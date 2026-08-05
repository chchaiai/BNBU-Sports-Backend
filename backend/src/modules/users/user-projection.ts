import { ApplicationError } from '../../common/errors/application-error.js';
import { USER_ROLES, type UserRole } from '../../common/http/request-context.js';

interface UserRecord {
  id: string;
  organizationId: string;
  role: string;
  status: string;
  primaryEmail: string | null;
  primaryPhone: string | null;
  emailVerifiedAt: Date | null;
  phoneVerifiedAt: Date | null;
  version: number;
}

export interface UserProjection {
  id: string;
  organizationId: string;
  role: UserRole;
  status: string;
  primaryEmailMasked: string | null;
  primaryPhoneMasked: string | null;
  emailVerified: boolean;
  phoneVerified: boolean;
  version: number;
}

function maskEmail(value: string | null): string | null {
  if (value === null) return null;
  const separator = value.lastIndexOf('@');
  if (separator <= 0) return '***';
  const local = value.slice(0, separator);
  return `${local.slice(0, 1)}***${value.slice(separator)}`;
}

function maskPhone(value: string | null): string | null {
  if (value === null) return null;
  return `***${value.slice(-4)}`;
}

export function projectUser(user: UserRecord): UserProjection {
  if (!USER_ROLES.includes(user.role as UserRole)) {
    throw new ApplicationError('SYSTEM_DATA_INTEGRITY_ERROR', 500, {
      invariant: 'USER_ROLE_UNSUPPORTED',
    });
  }
  if (!['ACTIVE', 'LOCKED', 'DISABLED'].includes(user.status)) {
    throw new ApplicationError('SYSTEM_DATA_INTEGRITY_ERROR', 500, {
      invariant: 'USER_STATUS_UNSUPPORTED',
    });
  }
  return {
    id: user.id,
    organizationId: user.organizationId,
    role: user.role as UserRole,
    status: user.status,
    primaryEmailMasked: maskEmail(user.primaryEmail),
    primaryPhoneMasked: maskPhone(user.primaryPhone),
    emailVerified: user.emailVerifiedAt !== null,
    phoneVerified: user.phoneVerifiedAt !== null,
    version: user.version,
  };
}
