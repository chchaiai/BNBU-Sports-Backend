import { Injectable } from '@nestjs/common';

import { AuditService } from '../../common/audit/audit.service.js';
import { PrismaService } from '../../common/database/prisma.service.js';
import { ApplicationError } from '../../common/errors/application-error.js';
import { pagedResult, type PagedResult } from '../../common/http/envelope.interceptor.js';
import type { AuthenticatedPrincipal } from '../../common/http/request-context.js';
import {
  IdempotencyService,
  type IdempotentFailure,
} from '../../common/idempotency/idempotency.service.js';
import { OutboxService } from '../../common/outbox/outbox.service.js';
import { ScopedCursorService } from '../../common/pagination/scoped-cursor.service.js';
import { SecureDigestService } from '../../common/security/secure-digest.service.js';
import { Clock } from '../../common/time/clock.js';
import { IdGenerator } from '../../common/time/id-generator.js';
import { Prisma } from '../../generated/prisma/client.js';
import type {
  CreateExemptionApplicationRequestDto,
  ExemptionApplicationListQueryDto,
  ReviewExemptionApplicationRequestDto,
  UpdateExemptionApplicationRequestDto,
} from './client-capabilities.dto.js';

const applicationInclude = {
  student: { select: { userId: true } },
  classSection: { include: { teacher: { select: { userId: true } } } },
  media: { orderBy: { position: 'asc' as const }, select: { mediaId: true } },
} as const;

type ApplicationRow = Prisma.ExemptionApplicationGetPayload<{ include: typeof applicationInclude }>;

interface MutationFacts {
  requestId: string;
  idempotencyKey: string | undefined;
}

export interface ExemptionApplicationProjection {
  id: string;
  studentId: string;
  enrollmentId: string;
  classSectionId: string;
  applicationType: string;
  reason: string;
  mediaIds: string[];
  status: string;
  publicComment: string | null;
  submittedAt: string | null;
  decidedAt: string | null;
  version: number;
}

@Injectable()
export class ExemptionApplicationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly idempotency: IdempotencyService,
    private readonly audit: AuditService,
    private readonly outbox: OutboxService,
    private readonly cursors: ScopedCursorService,
    private readonly digest: SecureDigestService,
    private readonly clock: Clock,
    private readonly ids: IdGenerator,
  ) {}

  async list(
    principal: AuthenticatedPrincipal,
    input: ExemptionApplicationListQueryDto,
  ): Promise<PagedResult<ExemptionApplicationProjection>> {
    const binding = {
      resource: 'EXEMPTION_APPLICATION' as const,
      organizationId: principal.organizationId,
      principalId: principal.userId,
      role: principal.role,
      filters: { status: input.status ?? null, classSectionId: input.classSectionId ?? null },
      sort: '-createdAt',
      limit: input.limit,
    };
    const position = this.cursors.decode(input.cursor, binding);
    const rows = await this.prisma.exemptionApplication.findMany({
      where: {
        organizationId: principal.organizationId,
        ...(input.status === undefined ? {} : { status: input.status }),
        ...(input.classSectionId === undefined ? {} : { classSectionId: input.classSectionId }),
        ...this.roleScope(principal),
        ...(position === null
          ? {}
          : {
              OR: [
                { createdAt: { lt: new Date(position.value) } },
                { createdAt: new Date(position.value), id: { lt: position.id } },
              ],
            }),
      },
      include: applicationInclude,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: input.limit + 1,
    });
    const hasMore = rows.length > input.limit;
    const page = hasMore ? rows.slice(0, input.limit) : rows;
    const last = page.at(-1);
    return pagedResult(
      page.map((row) => this.project(row)),
      {
        nextCursor:
          hasMore && last !== undefined
            ? this.cursors.encode(binding, { value: last.createdAt.toISOString(), id: last.id })
            : null,
        hasMore,
        limit: input.limit,
      },
    );
  }

  async get(
    principal: AuthenticatedPrincipal,
    applicationId: string,
  ): Promise<ExemptionApplicationProjection> {
    const row = await this.prisma.exemptionApplication.findFirst({
      where: {
        id: applicationId,
        organizationId: principal.organizationId,
        ...this.roleScope(principal),
      },
      include: applicationInclude,
    });
    if (row === null) throw new ApplicationError('EXEMPTION_APPLICATION_NOT_FOUND', 404);
    return this.project(row);
  }

  async create(
    principal: AuthenticatedPrincipal,
    input: CreateExemptionApplicationRequestDto,
    facts: MutationFacts,
  ): Promise<ExemptionApplicationProjection> {
    this.requireStudent(principal);
    return this.idempotency.execute(
      {
        organizationId: principal.organizationId,
        principalId: principal.userId,
        authSessionId: principal.sessionId,
        operationId: 'createExemptionApplication',
        scope: `enrollment:${input.enrollmentId}`,
        key: facts.idempotencyKey,
        request: input,
        requestId: facts.requestId,
      },
      async (transaction) => {
        const enrollment = await transaction.enrollment.findFirst({
          where: {
            id: input.enrollmentId,
            organizationId: principal.organizationId,
            status: 'ACTIVE',
            student: { userId: principal.userId, status: 'ACTIVE' },
          },
        });
        if (enrollment === null) {
          return this.idempotency.failure(new ApplicationError('ENROLLMENT_NOT_FOUND', 404));
        }
        const mediaFailure = await this.validateMedia(
          transaction,
          principal.organizationId,
          enrollment.studentId,
          enrollment.id,
          input.mediaIds,
          false,
        );
        if (mediaFailure !== null) return this.idempotency.failure(mediaFailure);
        const now = this.clock.now();
        const application = await transaction.exemptionApplication.create({
          data: {
            id: this.ids.next(),
            organizationId: principal.organizationId,
            semesterId: enrollment.semesterId,
            studentId: enrollment.studentId,
            enrollmentId: enrollment.id,
            classSectionId: enrollment.classSectionId,
            applicationType: input.applicationType,
            reason: input.reason,
            status: 'DRAFT',
            createdAt: now,
            updatedAt: now,
          },
        });
        await this.replaceMedia(transaction, application, input.mediaIds, now);
        await this.appendEvent(
          transaction,
          principal,
          application,
          'CREATED',
          null,
          'DRAFT',
          facts,
        );
        await this.appendAuditAndOutbox(transaction, principal, application, null, 'DRAFT', facts);
        const row = await this.load(transaction, application.id, principal.organizationId);
        return this.idempotency.success(this.project(row), {
          principalId: principal.userId,
          authSessionId: principal.sessionId,
          resourceType: 'EXEMPTION_APPLICATION',
          resourceId: application.id,
        });
      },
    );
  }

  async update(
    principal: AuthenticatedPrincipal,
    applicationId: string,
    input: UpdateExemptionApplicationRequestDto,
    facts: MutationFacts,
  ): Promise<ExemptionApplicationProjection> {
    this.requireStudent(principal);
    return this.idempotency.execute(
      {
        organizationId: principal.organizationId,
        principalId: principal.userId,
        authSessionId: principal.sessionId,
        operationId: 'updateExemptionApplication',
        scope: `application:${applicationId}`,
        key: facts.idempotencyKey,
        request: { applicationId, ...input },
        requestId: facts.requestId,
      },
      async (transaction) => {
        const current = await this.loadForStudent(transaction, principal, applicationId);
        if (current === null) return this.notFoundFailure();
        if (current.version !== input.expectedVersion) return this.versionFailure();
        if (current.status !== 'DRAFT' && current.status !== 'SUPPLEMENT_REQUIRED') {
          return this.transitionFailure();
        }
        if (input.reason === undefined && input.mediaIds === undefined) {
          return this.idempotency.failure(new ApplicationError('VALIDATION_FAILED', 422));
        }
        if (input.mediaIds !== undefined) {
          const mediaFailure = await this.validateMedia(
            transaction,
            current.organizationId,
            current.studentId,
            current.enrollmentId,
            input.mediaIds,
            false,
          );
          if (mediaFailure !== null) return this.idempotency.failure(mediaFailure);
        }
        const now = this.clock.now();
        const updated = await transaction.exemptionApplication.update({
          where: { id: current.id },
          data: {
            ...(input.reason === undefined ? {} : { reason: input.reason }),
            updatedAt: now,
            version: { increment: 1 },
          },
        });
        if (input.mediaIds !== undefined)
          await this.replaceMedia(transaction, updated, input.mediaIds, now);
        await this.appendEvent(
          transaction,
          principal,
          updated,
          'UPDATED',
          current.status,
          current.status,
          facts,
        );
        await this.appendAuditAndOutbox(
          transaction,
          principal,
          updated,
          current.status,
          current.status,
          facts,
        );
        return this.idempotency.success(
          this.project(await this.load(transaction, updated.id, updated.organizationId)),
          this.references(principal, updated.id),
        );
      },
    );
  }

  async submit(
    principal: AuthenticatedPrincipal,
    applicationId: string,
    expectedVersion: number,
    facts: MutationFacts,
  ): Promise<ExemptionApplicationProjection> {
    this.requireStudent(principal);
    return this.idempotency.execute(
      {
        organizationId: principal.organizationId,
        principalId: principal.userId,
        authSessionId: principal.sessionId,
        operationId: 'submitExemptionApplication',
        scope: `application:${applicationId}`,
        key: facts.idempotencyKey,
        request: { applicationId, expectedVersion },
        requestId: facts.requestId,
      },
      async (transaction) => {
        const current = await this.loadForStudent(transaction, principal, applicationId);
        if (current === null) return this.notFoundFailure();
        if (current.version !== expectedVersion) return this.versionFailure();
        if (current.status !== 'DRAFT' && current.status !== 'SUPPLEMENT_REQUIRED')
          return this.transitionFailure();
        const mediaFailure = await this.validateMedia(
          transaction,
          current.organizationId,
          current.studentId,
          current.enrollmentId,
          current.media.map(({ mediaId }) => mediaId),
          true,
        );
        if (mediaFailure !== null) return this.idempotency.failure(mediaFailure);
        const now = this.clock.now();
        const updated = await transaction.exemptionApplication.update({
          where: { id: current.id },
          data: {
            status: 'SUBMITTED',
            submittedAt: now,
            decidedAt: null,
            updatedAt: now,
            version: { increment: 1 },
          },
        });
        await this.appendEvent(
          transaction,
          principal,
          updated,
          'SUBMITTED',
          current.status,
          'SUBMITTED',
          facts,
        );
        await this.appendAuditAndOutbox(
          transaction,
          principal,
          updated,
          current.status,
          'SUBMITTED',
          facts,
        );
        return this.idempotency.success(
          this.project(await this.load(transaction, updated.id, updated.organizationId)),
          this.references(principal, updated.id),
        );
      },
    );
  }

  async review(
    principal: AuthenticatedPrincipal,
    applicationId: string,
    input: ReviewExemptionApplicationRequestDto,
    facts: MutationFacts,
  ): Promise<ExemptionApplicationProjection> {
    if (principal.role !== 'TEACHER')
      throw new ApplicationError('PERMISSION_EXEMPTION_REVIEW_SCOPE_DENIED', 403);
    return this.idempotency.execute(
      {
        organizationId: principal.organizationId,
        principalId: principal.userId,
        authSessionId: principal.sessionId,
        operationId: 'reviewExemptionApplication',
        scope: `application:${applicationId}`,
        key: facts.idempotencyKey,
        request: { applicationId, ...input },
        requestId: facts.requestId,
      },
      async (transaction) => {
        const current = await transaction.exemptionApplication.findFirst({
          where: { id: applicationId, organizationId: principal.organizationId },
          include: applicationInclude,
        });
        if (current === null) return this.notFoundFailure();
        if (current.classSection.teacher.userId !== principal.userId) {
          return this.idempotency.failure(
            new ApplicationError('PERMISSION_EXEMPTION_REVIEW_SCOPE_DENIED', 403),
          );
        }
        if (current.version !== input.expectedVersion) return this.versionFailure();
        if (current.status !== 'SUBMITTED') return this.transitionFailure();
        const teacher = await transaction.teacherProfile.findUnique({
          where: { userId: principal.userId },
        });
        if (teacher?.organizationId !== principal.organizationId) {
          return this.idempotency.failure(
            new ApplicationError('PERMISSION_EXEMPTION_REVIEW_SCOPE_DENIED', 403),
          );
        }
        const previous = await transaction.exemptionReviewRecord.findFirst({
          where: { applicationId: current.id, organizationId: principal.organizationId },
          orderBy: { reviewVersion: 'desc' },
        });
        const nextStatus =
          input.decision === 'APPROVE'
            ? 'APPROVED'
            : input.decision === 'REJECT'
              ? 'REJECTED'
              : 'SUPPLEMENT_REQUIRED';
        const now = this.clock.now();
        await transaction.exemptionReviewRecord.create({
          data: {
            id: this.ids.next(),
            organizationId: principal.organizationId,
            applicationId: current.id,
            reviewVersion: (previous?.reviewVersion ?? 0) + 1,
            previousReviewId: previous?.id ?? null,
            teacherId: teacher.id,
            decision: input.decision,
            publicComment: input.publicComment,
            internalNote: input.internalNote ?? null,
            requestId: facts.requestId,
            reviewedAt: now,
          },
        });
        const updated = await transaction.exemptionApplication.update({
          where: { id: current.id },
          data: {
            status: nextStatus,
            publicComment: input.publicComment,
            decidedAt: nextStatus === 'APPROVED' || nextStatus === 'REJECTED' ? now : null,
            updatedAt: now,
            version: { increment: 1 },
          },
        });
        await this.appendEvent(
          transaction,
          principal,
          updated,
          'REVIEWED',
          current.status,
          nextStatus,
          facts,
        );
        await this.appendAuditAndOutbox(
          transaction,
          principal,
          updated,
          current.status,
          nextStatus,
          facts,
        );
        return this.idempotency.success(
          this.project(await this.load(transaction, updated.id, updated.organizationId)),
          this.references(principal, updated.id),
        );
      },
    );
  }

  private roleScope(principal: AuthenticatedPrincipal): Prisma.ExemptionApplicationWhereInput {
    if (principal.role === 'STUDENT') return { student: { userId: principal.userId } };
    if (principal.role === 'TEACHER')
      return { classSection: { teacher: { userId: principal.userId } } };
    return {};
  }

  private requireStudent(principal: AuthenticatedPrincipal): void {
    if (principal.role !== 'STUDENT')
      throw new ApplicationError('PERMISSION_RESOURCE_SCOPE_DENIED', 403);
  }

  private loadForStudent(
    transaction: Prisma.TransactionClient,
    principal: AuthenticatedPrincipal,
    applicationId: string,
  ): Promise<ApplicationRow | null> {
    return transaction.exemptionApplication.findFirst({
      where: {
        id: applicationId,
        organizationId: principal.organizationId,
        student: { userId: principal.userId },
      },
      include: applicationInclude,
    });
  }

  private async load(
    transaction: Prisma.TransactionClient,
    applicationId: string,
    organizationId: string,
  ): Promise<ApplicationRow> {
    const row = await transaction.exemptionApplication.findFirst({
      where: { id: applicationId, organizationId },
      include: applicationInclude,
    });
    if (row === null)
      throw new ApplicationError('SYSTEM_DATA_INTEGRITY_ERROR', 500, {
        invariant: 'EXEMPTION_APPLICATION_PROJECTION_REQUIRED',
      });
    return row;
  }

  private async validateMedia(
    transaction: Prisma.TransactionClient,
    organizationId: string,
    studentId: string,
    enrollmentId: string,
    mediaIds: readonly string[],
    requireAvailable: boolean,
  ): Promise<ApplicationError | null> {
    if (new Set(mediaIds).size !== mediaIds.length || mediaIds.length > 20)
      return new ApplicationError('EXEMPTION_APPLICATION_MEDIA_INVALID', 422);
    if (mediaIds.length === 0) return null;
    const media = await transaction.mediaEvidence.findMany({
      where: {
        id: { in: [...mediaIds] },
        organizationId,
        ownerStudentId: studentId,
        enrollmentId,
        businessPurpose: 'EXEMPTION_APPLICATION',
      },
      select: { id: true, uploadStatus: true },
    });
    if (
      media.length !== mediaIds.length ||
      media.some(({ uploadStatus }) =>
        requireAvailable
          ? uploadStatus !== 'AVAILABLE'
          : !['UPLOADED', 'BOUND', 'PROCESSING', 'AVAILABLE'].includes(uploadStatus),
      )
    ) {
      return new ApplicationError('EXEMPTION_APPLICATION_MEDIA_INVALID', 422);
    }
    return null;
  }

  private async replaceMedia(
    transaction: Prisma.TransactionClient,
    application: { id: string; organizationId: string },
    mediaIds: readonly string[],
    now: Date,
  ): Promise<void> {
    await transaction.exemptionApplicationMedia.deleteMany({
      where: { applicationId: application.id, organizationId: application.organizationId },
    });
    if (mediaIds.length > 0) {
      await transaction.exemptionApplicationMedia.createMany({
        data: mediaIds.map((mediaId, position) => ({
          organizationId: application.organizationId,
          applicationId: application.id,
          mediaId,
          position,
          createdAt: now,
        })),
      });
    }
  }

  private async appendEvent(
    transaction: Prisma.TransactionClient,
    principal: AuthenticatedPrincipal,
    application: { id: string; organizationId: string; version: number },
    eventType: string,
    fromStatus: string | null,
    toStatus: string,
    facts: MutationFacts,
  ): Promise<void> {
    await transaction.exemptionApplicationEvent.create({
      data: {
        id: this.ids.next(),
        organizationId: application.organizationId,
        applicationId: application.id,
        eventType,
        fromStatus,
        toStatus,
        actorUserId: principal.userId,
        authSessionId: principal.sessionId,
        requestId: facts.requestId,
        idempotencyKeyReference:
          facts.idempotencyKey === undefined
            ? null
            : this.digest.digest('idempotency-key-reference', facts.idempotencyKey),
        eventVersion: application.version,
        occurredAt: this.clock.now(),
      },
    });
  }

  private async appendAuditAndOutbox(
    transaction: Prisma.TransactionClient,
    principal: AuthenticatedPrincipal,
    application: { id: string; organizationId: string; classSectionId: string; version: number },
    previousStatus: string | null,
    nextStatus: string,
    facts: MutationFacts,
  ): Promise<void> {
    await this.audit.append(transaction, {
      organizationId: application.organizationId,
      actorUserId: principal.userId,
      actorRoleSnapshot: principal.role,
      permissionId: principal.role === 'TEACHER' ? 'EXEMPTION-REVIEW' : 'EXEMPTION-WRITE',
      actionType: 'EXEMPTION_APPLICATION_CHANGED',
      targetType: 'EXEMPTION_APPLICATION',
      targetId: application.id,
      requestId: facts.requestId,
      outcome: 'SUCCEEDED',
      safeMetadata: { previousStatus, nextStatus, classSectionId: application.classSectionId },
    });
    await this.outbox.append(transaction, {
      organizationId: application.organizationId,
      aggregateType: 'EXEMPTION_APPLICATION',
      aggregateId: application.id,
      eventType: 'EXEMPTION_APPLICATION_CHANGED',
      eventVersion: application.version,
      payload: {
        requestId: facts.requestId,
        applicationId: application.id,
        previousStatus,
        nextStatus,
      },
    });
  }

  private project(row: ApplicationRow): ExemptionApplicationProjection {
    return {
      id: row.id,
      studentId: row.studentId,
      enrollmentId: row.enrollmentId,
      classSectionId: row.classSectionId,
      applicationType: row.applicationType,
      reason: row.reason,
      mediaIds: row.media.map(({ mediaId }) => mediaId),
      status: row.status,
      publicComment: row.publicComment,
      submittedAt: row.submittedAt?.toISOString() ?? null,
      decidedAt: row.decidedAt?.toISOString() ?? null,
      version: row.version,
    };
  }

  private references(
    principal: AuthenticatedPrincipal,
    applicationId: string,
  ): {
    principalId: string;
    authSessionId: string;
    resourceType: string;
    resourceId: string;
  } {
    return {
      principalId: principal.userId,
      authSessionId: principal.sessionId,
      resourceType: 'EXEMPTION_APPLICATION',
      resourceId: applicationId,
    };
  }

  private notFoundFailure(): IdempotentFailure {
    return this.idempotency.failure(new ApplicationError('EXEMPTION_APPLICATION_NOT_FOUND', 404));
  }

  private versionFailure(): IdempotentFailure {
    return this.idempotency.failure(new ApplicationError('CONFLICT_VERSION_MISMATCH', 409));
  }

  private transitionFailure(): IdempotentFailure {
    return this.idempotency.failure(
      new ApplicationError('EXEMPTION_APPLICATION_TRANSITION_NOT_ALLOWED', 409),
    );
  }
}
