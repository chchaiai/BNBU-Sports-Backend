import assert from 'node:assert/strict';
import { createServer } from 'node:net';
import { resolve } from 'node:path';
import { after, before, beforeEach, describe, it } from 'node:test';
import { pathToFileURL } from 'node:url';

import { ValidationPipe, type INestApplication, type Type } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { argon2id, hash } from 'argon2';
import { json, urlencoded } from 'express';
import { importPKCS8, SignJWT } from 'jose';
import { v7 as uuidv7 } from 'uuid';

import type { RuntimeConfig } from '../../src/common/config/environment.js';
import type { BodyParserErrorMiddleware as BodyParserErrorMiddlewareType } from '../../src/common/http/body-parser-error.middleware.js';
import type { RequestIdMiddleware as RequestIdMiddlewareType } from '../../src/common/http/request-id.js';
import type { validationException as ValidationExceptionFactory } from '../../src/common/http/validation.js';
import type { PrismaClient } from '../../src/generated/prisma/client.js';
import {
  createTestPrisma,
  resetFoundationDatabase,
  seedFoundationFixture,
  type FoundationFixture,
} from '../helpers/database.js';
import { seedSubmittedExerciseRecord } from '../helpers/exercise-review.js';
import {
  foundationEnvironment,
  requireTestDatabaseUrl,
  TEST_PASSWORD,
  TEST_PRIVATE_KEY,
} from '../helpers/test-environment.js';

interface HttpResult {
  status: number;
  body: Record<string, unknown>;
}

function object(value: unknown): Record<string, unknown> {
  assert.equal(typeof value, 'object');
  assert.notEqual(value, null);
  assert.equal(Array.isArray(value), false);
  return value as Record<string, unknown>;
}

function compiledModule(relativePath: string): string {
  return pathToFileURL(resolve('dist', relativePath)).href;
}

async function availablePort(): Promise<number> {
  const server = createServer();
  await new Promise<void>((resolvePromise, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolvePromise);
  });
  const address = server.address();
  assert.ok(address && typeof address === 'object');
  await new Promise<void>((resolvePromise, reject) =>
    server.close((error) => (error ? reject(error) : resolvePromise())),
  );
  return address.port;
}

describe('Stage 18 Score HTTP E2E', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  let fixture: FoundationFixture;
  let baseUrl: string;

  const request = async (path: string, init: RequestInit = {}): Promise<HttpResult> => {
    const response = await fetch(`${baseUrl}${path}`, init);
    const text = await response.text();
    return {
      status: response.status,
      body: text.length === 0 ? {} : (JSON.parse(text) as Record<string, unknown>),
    };
  };

  const authenticated = (
    token: string,
    method = 'GET',
    body?: Record<string, unknown>,
    key?: string,
  ): RequestInit => ({
    method,
    headers: {
      authorization: `Bearer ${token}`,
      ...(body === undefined ? {} : { 'content-type': 'application/json' }),
      ...(key === undefined ? {} : { 'idempotency-key': key }),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });

  before(async () => {
    const databaseUrl = requireTestDatabaseUrl();
    prisma = createTestPrisma(databaseUrl);
    const port = await availablePort();
    Object.assign(process.env, foundationEnvironment(databaseUrl, port));
    const { AppModule } = (await import(compiledModule('app.module.js'))) as {
      AppModule: Type<unknown>;
    };
    const { RUNTIME_CONFIG } = (await import(
      compiledModule('common/config/runtime-config.module.js')
    )) as { RUNTIME_CONFIG: symbol };
    const { RequestIdMiddleware } = (await import(compiledModule('common/http/request-id.js'))) as {
      RequestIdMiddleware: Type<RequestIdMiddlewareType>;
    };
    const { BodyParserErrorMiddleware } = (await import(
      compiledModule('common/http/body-parser-error.middleware.js')
    )) as { BodyParserErrorMiddleware: Type<BodyParserErrorMiddlewareType> };
    const { validationException } = (await import(compiledModule('common/http/validation.js'))) as {
      validationException: typeof ValidationExceptionFactory;
    };
    const module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = module.createNestApplication({ bodyParser: false });
    const config = app.get<RuntimeConfig>(RUNTIME_CONFIG);
    const requestIds = app.get(RequestIdMiddleware);
    const bodyParserErrors = app.get(BodyParserErrorMiddleware);
    app.use(requestIds.use.bind(requestIds));
    app.use(json({ limit: config.requestBodyLimitBytes, strict: true }));
    app.use(
      urlencoded({ extended: false, limit: config.requestBodyLimitBytes, parameterLimit: 100 }),
    );
    app.use(bodyParserErrors.use.bind(bodyParserErrors));
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
        forbidUnknownValues: true,
        exceptionFactory: validationException,
      }),
    );
    app.setGlobalPrefix('api/v1');
    await app.listen(port, '127.0.0.1');
    baseUrl = `http://127.0.0.1:${port}`;
  });

  beforeEach(async () => {
    await resetFoundationDatabase(prisma);
    fixture = await seedFoundationFixture(prisma);
  });

  after(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  const login = async (account: string): Promise<string> => {
    const response = await request('/api/v1/auth/password-login', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'idempotency-key': uuidv7() },
      body: JSON.stringify({ account, password: TEST_PASSWORD }),
    });
    assert.equal(response.status, 200, JSON.stringify(response.body));
    return String(object(response.body.data).accessToken);
  };

  const tokenFor = async (userId: string, role: 'STUDENT' | 'ADMIN'): Promise<string> => {
    const session = await prisma.authSession.findFirstOrThrow({ where: { userId } });
    const seconds = Math.floor(Date.now() / 1000);
    return new SignJWT({
      organizationId: session.organizationId,
      role,
      sessionId: session.id,
      tokenVersion: 0,
    })
      .setProtectedHeader({ alg: 'EdDSA', typ: 'JWT' })
      .setSubject(userId)
      .setJti(uuidv7())
      .setIssuer('bnbu-sports-test')
      .setAudience('bnbu-sports-test-clients')
      .setIssuedAt(seconds)
      .setExpirationTime(seconds + 600)
      .sign(await importPKCS8(TEST_PRIVATE_KEY, 'EdDSA'));
  };

  const seedApprover = async (suffix: string): Promise<string> => {
    const now = new Date();
    const userId = uuidv7();
    const email = `score.admin.${suffix.toLowerCase()}.synthetic@bnbu.invalid`;
    await prisma.$transaction(async (transaction) => {
      await transaction.user.create({
        data: {
          id: userId,
          organizationId: fixture.organizationId,
          role: 'ADMIN',
          status: 'ACTIVE',
          primaryEmail: email,
          primaryEmailNormalized: email,
          emailVerifiedAt: now,
          passwordHash: await hash(TEST_PASSWORD, { type: argon2id }),
          createdAt: now,
          updatedAt: now,
        },
      });
      await transaction.adminProfile.create({
        data: {
          id: uuidv7(),
          organizationId: fixture.organizationId,
          userId,
          employeeNumber: `SYNTH-SCORE-${suffix}`,
          fullName: `Synthetic Score Admin ${suffix}`,
          departmentName: 'Synthetic Score Governance',
          status: 'ACTIVE',
          createdAt: now,
          updatedAt: now,
        },
      });
      await transaction.authSession.create({
        data: {
          id: uuidv7(),
          organizationId: fixture.organizationId,
          userId,
          status: 'ACTIVE',
          tokenFamilyId: uuidv7(),
          createdAt: now,
          lastSeenAt: now,
          absoluteExpiresAt: new Date(now.getTime() + 3_600_000),
          idleExpiresAt: new Date(now.getTime() + 3_600_000),
        },
      });
    });
    return tokenFor(userId, 'ADMIN');
  };

  it('closes dual approval, auto-recalculation, publication, review replay, adjustment, and default deny', async () => {
    const record = await seedSubmittedExerciseRecord(prisma, fixture, 'SCORE-FLOW');
    const creator = await login(fixture.adminEmail);
    const approverOne = await seedApprover('ONE');
    const approverTwo = await seedApprover('TWO');
    const teacher = await login(fixture.teacherEmail);

    const reviewed = await request(
      `/api/v1/exercise-records/${record.recordId}/reviews`,
      authenticated(
        teacher,
        'POST',
        { result: 'VALID', expectedReviewVersion: 1, expectedVersion: 2 },
        uuidv7(),
      ),
    );
    assert.equal(reviewed.status, 201, JSON.stringify(reviewed.body));

    const created = await request(
      `/api/v1/class-sections/${fixture.teacherAActiveSectionId}/score-rules`,
      authenticated(
        creator,
        'POST',
        { ruleCode: 'FIXED_V1', displayName: 'Synthetic Fixed V1' },
        uuidv7(),
      ),
    );
    assert.equal(created.status, 201, JSON.stringify(created.body));
    const ruleId = String(object(created.body.data).id);

    const submitted = await request(
      `/api/v1/score-rules/${ruleId}/submit-approval`,
      authenticated(creator, 'POST', { expectedVersion: 1 }, uuidv7()),
    );
    assert.equal(submitted.status, 200, JSON.stringify(submitted.body));
    assert.equal(object(submitted.body.data).status, 'PENDING_APPROVAL');

    const selfApproval = await request(
      `/api/v1/score-rules/${ruleId}/approve`,
      authenticated(creator, 'POST', { expectedVersion: 2 }, uuidv7()),
    );
    assert.equal(selfApproval.status, 409);
    assert.equal(selfApproval.body.code, 'SCORE_RULE_SELF_APPROVAL_NOT_ALLOWED');

    const firstApproval = await request(
      `/api/v1/score-rules/${ruleId}/approve`,
      authenticated(approverOne, 'POST', { expectedVersion: 2 }, uuidv7()),
    );
    assert.equal(firstApproval.status, 200, JSON.stringify(firstApproval.body));
    assert.equal(object(firstApproval.body.data).approvalCount, 1);
    const duplicateApproval = await request(
      `/api/v1/score-rules/${ruleId}/approve`,
      authenticated(approverOne, 'POST', { expectedVersion: 3 }, uuidv7()),
    );
    assert.equal(duplicateApproval.status, 409);
    assert.equal(duplicateApproval.body.code, 'SCORE_RULE_DISTINCT_APPROVER_REQUIRED');

    const activated = await request(
      `/api/v1/score-rules/${ruleId}/approve`,
      authenticated(approverTwo, 'POST', { expectedVersion: 3 }, uuidv7()),
    );
    assert.equal(activated.status, 200, JSON.stringify(activated.body));
    assert.equal(object(activated.body.data).status, 'ACTIVE');
    assert.equal(object(activated.body.data).approvalCount, 2);

    const scoreRow = await prisma.studentScore.findFirstOrThrow({
      where: { studentId: record.studentId },
      include: { currentWorkingRevision: true },
    });
    assert.equal(scoreRow.currentWorkingRevision?.totalValidCreditedSeconds, 3600n);
    assert.equal(scoreRow.currentWorkingRevision?.finalScore.toFixed(2), '5.00');

    const scoreList = await request(
      `/api/v1/student-scores?classSectionId=${fixture.teacherAActiveSectionId}`,
      authenticated(teacher),
    );
    assert.equal(scoreList.status, 200);
    assert.equal((scoreList.body.data as unknown[]).length, 1);

    const manualKey = uuidv7();
    const manual = await request(
      `/api/v1/student-scores/${scoreRow.id}/recalculate`,
      authenticated(teacher, 'POST', { expectedVersion: 2 }, manualKey),
    );
    const manualReplay = await request(
      `/api/v1/student-scores/${scoreRow.id}/recalculate`,
      authenticated(teacher, 'POST', { expectedVersion: 2 }, manualKey),
    );
    assert.equal(manual.status, 202, JSON.stringify(manual.body));
    assert.deepEqual(manualReplay.body.data, manual.body.data);

    const published = await request(
      `/api/v1/student-scores/${scoreRow.id}/publish`,
      authenticated(teacher, 'POST', { expectedVersion: 2 }, uuidv7()),
    );
    assert.equal(published.status, 200, JSON.stringify(published.body));
    const firstPublishedRevision = String(object(object(published.body.data).publishedRevision).id);

    const reopened = await request(
      `/api/v1/exercise-records/${record.recordId}/reviews/reopen`,
      authenticated(
        teacher,
        'POST',
        { reason: 'Synthetic recalculation check', expectedReviewVersion: 2, expectedVersion: 3 },
        uuidv7(),
      ),
    );
    assert.equal(reopened.status, 201, JSON.stringify(reopened.body));
    const afterReopen = await prisma.studentScore.findUniqueOrThrow({ where: { id: scoreRow.id } });
    assert.notEqual(afterReopen.currentWorkingRevisionId, firstPublishedRevision);
    assert.equal(afterReopen.publishedRevisionId, firstPublishedRevision);

    const reviewedAgain = await request(
      `/api/v1/exercise-records/${record.recordId}/reviews`,
      authenticated(
        teacher,
        'POST',
        { result: 'VALID', expectedReviewVersion: 3, expectedVersion: 4 },
        uuidv7(),
      ),
    );
    assert.equal(reviewedAgain.status, 201, JSON.stringify(reviewedAgain.body));
    const working = await prisma.studentScore.findUniqueOrThrow({ where: { id: scoreRow.id } });
    const republished = await request(
      `/api/v1/student-scores/${scoreRow.id}/publish`,
      authenticated(teacher, 'POST', { expectedVersion: working.version }, uuidv7()),
    );
    assert.equal(republished.status, 200, JSON.stringify(republished.body));

    const beforeAdjustment = await prisma.studentScore.findUniqueOrThrow({
      where: { id: scoreRow.id },
    });
    const adjustment = await request(
      `/api/v1/student-scores/${scoreRow.id}/adjustments`,
      authenticated(
        teacher,
        'POST',
        {
          adjustmentType: 'FINAL_SCORE_DELTA',
          adjustmentValue: 1.25,
          reasonCode: 'VERIFIED_DATA_ERROR',
          reason: 'Synthetic verified data correction',
          evidenceReference: 'audit:case/SYNTH-SCORE-001',
          expectedVersion: beforeAdjustment.version,
        },
        uuidv7(),
      ),
    );
    assert.equal(adjustment.status, 201, JSON.stringify(adjustment.body));
    const adjustmentId = String(object(adjustment.body.data).id);
    const teacherSelfApproval = await request(
      `/api/v1/score-adjustments/${adjustmentId}/approve`,
      authenticated(teacher, 'POST', { expectedVersion: 1 }, uuidv7()),
    );
    assert.equal(teacherSelfApproval.status, 403);

    const adjustmentApproval = await request(
      `/api/v1/score-adjustments/${adjustmentId}/approve`,
      authenticated(approverOne, 'POST', { expectedVersion: 1 }, uuidv7()),
    );
    assert.equal(adjustmentApproval.status, 200, JSON.stringify(adjustmentApproval.body));
    assert.equal(object(adjustmentApproval.body.data).status, 'APPROVED');
    const adjustedScore = await prisma.studentScore.findUniqueOrThrow({
      where: { id: scoreRow.id },
      include: { currentWorkingRevision: true },
    });
    assert.equal(adjustedScore.currentWorkingRevision?.finalScore.toFixed(2), '6.25');

    const adjustedPublication = await request(
      `/api/v1/student-scores/${scoreRow.id}/publish`,
      authenticated(teacher, 'POST', { expectedVersion: adjustedScore.version }, uuidv7()),
    );
    assert.equal(adjustedPublication.status, 200, JSON.stringify(adjustedPublication.body));
    const finalScore = await prisma.studentScore.findUniqueOrThrow({ where: { id: scoreRow.id } });
    const correction = await request(
      `/api/v1/student-scores/${scoreRow.id}/open-correction`,
      authenticated(
        teacher,
        'POST',
        { reason: 'Must remain disabled', expectedVersion: finalScore.version },
        uuidv7(),
      ),
    );
    assert.equal(correction.status, 409);
    assert.equal(correction.body.code, 'SCORE_CORRECTION_NOT_ALLOWED');

    const student = await tokenFor(record.studentUserId, 'STUDENT');
    const studentRead = await request(
      `/api/v1/student-scores/${scoreRow.id}`,
      authenticated(student),
    );
    assert.equal(studentRead.status, 200, JSON.stringify(studentRead.body));
    const studentProjection = object(studentRead.body.data);
    assert.equal(object(studentProjection.publishedScore).finalScore, 6.25);
    for (const forbidden of [
      'studentId',
      'workingRevision',
      'sourceFingerprint',
      'approvalEvents',
      'internalNote',
    ]) {
      assert.equal(Object.hasOwn(studentProjection, forbidden), false);
    }

    assert.equal(await prisma.scoreRuleApprovalEvent.count({ where: { scoreRuleId: ruleId } }), 2);
    assert.equal(
      await prisma.scorePublicationEvent.count({ where: { studentScoreId: scoreRow.id } }),
      3,
    );
    assert.equal(await prisma.scoreAdjustment.count({ where: { studentScoreId: scoreRow.id } }), 1);
    assert.equal(await prisma.exerciseSession.count({ where: { id: record.sessionId } }), 1);
    assert.equal(await prisma.exerciseRecord.count({ where: { id: record.recordId } }), 1);
  });
});
