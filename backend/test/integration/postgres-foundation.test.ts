import assert from 'node:assert/strict';
import { after, before, beforeEach, describe, it } from 'node:test';

import { v7 as uuidv7 } from 'uuid';

import type { PrismaService } from '../../src/common/database/prisma.service.js';
import { ApplicationError } from '../../src/common/errors/application-error.js';
import { OutboxService } from '../../src/common/outbox/outbox.service.js';
import { FixedClock } from '../../src/common/time/clock.js';
import { UuidV7Generator } from '../../src/common/time/id-generator.js';
import { foundationMigrations } from '../../src/generated/migration-manifest.generated.js';
import type { PrismaClient } from '../../src/generated/prisma/client.js';
import {
  createTestPrisma,
  resetFoundationDatabase,
  seedFoundationFixture,
  type FoundationFixture,
} from '../helpers/database.js';
import { requireTestDatabaseUrl } from '../helpers/test-environment.js';

describe('PostgreSQL 18 Foundation integration', () => {
  let prisma: PrismaClient;
  let fixture: FoundationFixture;

  before(() => {
    prisma = createTestPrisma(requireTestDatabaseUrl());
  });

  beforeEach(async () => {
    await resetFoundationDatabase(prisma);
    fixture = await seedFoundationFixture(prisma);
  });

  after(async () => {
    await prisma.$disconnect();
  });

  it('records every exact finished Greenfield migration and checksum', async () => {
    const rows = await prisma.$queryRaw<
      { migration_name: string; checksum: string; finished_at: Date | null }[]
    >`
      SELECT migration_name, checksum, finished_at
      FROM "_prisma_migrations"
      ORDER BY migration_name
    `;
    assert.equal(rows.length, foundationMigrations.length);
    for (const [index, migration] of foundationMigrations.entries()) {
      assert.equal(rows[index]?.migration_name, migration.migrationId);
      assert.equal(rows[index]?.checksum, migration.sha256);
      assert.notEqual(rows[index]?.finished_at, null);
    }
  });

  it('enforces foreign keys and one CURRENT semester per organization', async () => {
    await assert.rejects(
      prisma.user.create({
        data: {
          id: uuidv7(),
          organizationId: uuidv7(),
          role: 'STUDENT',
          status: 'ACTIVE',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      }),
    );
    await assert.rejects(
      prisma.semester.create({
        data: {
          id: uuidv7(),
          organizationId: fixture.organizationId,
          academicYear: '2027-2028',
          termCode: 'FIRST',
          displayName: 'Conflicting Current Semester',
          startDate: new Date('2027-08-01T00:00:00.000Z'),
          endDate: new Date('2028-01-31T00:00:00.000Z'),
          status: 'CURRENT',
          createdBy: fixture.adminUserId,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      }),
    );
  });

  it('preserves student-number leading zeros and enforces exactly one role Profile', async () => {
    const studentUserId = uuidv7();
    await prisma.$transaction(async (transaction) => {
      await transaction.user.create({
        data: {
          id: studentUserId,
          organizationId: fixture.organizationId,
          role: 'STUDENT',
          status: 'ACTIVE',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
      await transaction.studentProfile.create({
        data: {
          id: uuidv7(),
          organizationId: fixture.organizationId,
          userId: studentUserId,
          studentNumber: '00123456',
          fullName: 'Synthetic Student',
          gender: 'OTHER',
          gradeYear: 2026,
          status: 'ACTIVE',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
    });
    const profile = await prisma.studentProfile.findUniqueOrThrow({
      where: { userId: studentUserId },
    });
    assert.equal(profile.studentNumber, '00123456');

    await assert.rejects(
      prisma.teacherProfile.create({
        data: {
          id: uuidv7(),
          organizationId: fixture.organizationId,
          userId: studentUserId,
          employeeNumber: 'INVALID-DUAL-PROFILE',
          fullName: 'Invalid Dual Profile',
          status: 'ACTIVE',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      }),
    );
  });

  it('keeps AuditLog append-only at the database boundary', async () => {
    const auditId = uuidv7();
    await prisma.auditLog.create({
      data: {
        id: auditId,
        organizationId: fixture.organizationId,
        actorUserId: fixture.adminUserId,
        actorRoleSnapshot: 'ADMIN',
        permissionId: 'AUTH-LOGOUT',
        actionType: 'AUTH_SESSION_REVOKED',
        targetType: 'USER',
        targetId: fixture.adminUserId,
        requestId: 'req-integration',
        outcome: 'SUCCEEDED',
        safeMetadata: { revokeSource: 'LOGOUT' },
        occurredAt: new Date(),
      },
    });
    await assert.rejects(
      prisma.$executeRaw`UPDATE audit_logs SET outcome = 'FAILED' WHERE id = ${auditId}::uuid`,
    );
    await assert.rejects(prisma.$executeRaw`DELETE FROM audit_logs WHERE id = ${auditId}::uuid`);
    assert.equal(await prisma.auditLog.count({ where: { id: auditId } }), 1);
  });

  it('claims Outbox rows concurrently without duplicate ownership', async () => {
    const now = new Date('2026-08-02T12:00:00.000Z');
    await prisma.outboxEvent.createMany({
      data: Array.from({ length: 6 }, (_unused, index) => ({
        id: uuidv7(),
        organizationId: fixture.organizationId,
        aggregateType: 'User',
        aggregateId: fixture.teacherUserId,
        eventType: 'SYNTHETIC_INTEGRATION_EVENT',
        eventVersion: index + 1,
        payload: { sequence: index + 1 },
        status: 'PENDING',
        availableAt: now,
        createdAt: now,
      })),
    });
    const outbox = new OutboxService(
      prisma as unknown as PrismaService,
      new FixedClock(now),
      new UuidV7Generator(),
    );
    const [left, right] = await Promise.all([
      outbox.claimBatch('worker-left', 3),
      outbox.claimBatch('worker-right', 3),
    ]);
    assert.equal(left.length + right.length, 6);
    const ids = [...left, ...right].map(({ id }) => id);
    assert.equal(new Set(ids).size, 6);
  });

  it('persists SystemMode, rejects unknown values, and rolls transactions back', async () => {
    await prisma.systemPolicy.update({
      where: { organizationId: fixture.organizationId },
      data: {
        systemMode: 'READ_ONLY',
        version: { increment: 1 },
        changeReason: 'Synthetic integration transition',
        updatedAt: new Date(),
      },
    });
    assert.equal(
      (
        await prisma.systemPolicy.findUniqueOrThrow({
          where: { organizationId: fixture.organizationId },
        })
      ).systemMode,
      'READ_ONLY',
    );
    await assert.rejects(
      prisma.systemPolicy.update({
        where: { organizationId: fixture.organizationId },
        data: { systemMode: 'UNKNOWN_MODE' },
      }),
    );

    const rollbackOrganizationId = uuidv7();
    await assert.rejects(
      prisma.$transaction(async (transaction) => {
        await transaction.organization.create({
          data: {
            id: rollbackOrganizationId,
            organizationCode: 'ROLLBACK-TEST',
            legalName: 'Synthetic Rollback Test',
            displayName: 'Synthetic Rollback',
            timezone: 'Asia/Shanghai',
            defaultLocale: 'zh-CN',
            status: 'ACTIVE',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });
        throw new ApplicationError('SYSTEM_INTERNAL_ERROR', 500);
      }),
    );
    assert.equal(await prisma.organization.count({ where: { id: rollbackOrganizationId } }), 0);
  });
});
