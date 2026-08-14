import assert from 'node:assert/strict';
import { createServer } from 'node:net';
import { resolve } from 'node:path';
import { after, before, beforeEach, describe, it } from 'node:test';
import { pathToFileURL } from 'node:url';

import { ValidationPipe, type INestApplication, type Type } from '@nestjs/common';
import { Test } from '@nestjs/testing';
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
import {
  seedExerciseSessionStudent,
  type ExerciseSessionStudentFixture,
} from '../helpers/exercise-session.js';
import {
  foundationEnvironment,
  requireTestDatabaseUrl,
  TEST_PRIVATE_KEY,
} from '../helpers/test-environment.js';

interface HttpResult {
  status: number;
  body: Record<string, unknown>;
  headers: Headers;
}

function object(value: unknown): Record<string, unknown> {
  assert.equal(typeof value, 'object');
  assert.notEqual(value, null);
  assert.equal(Array.isArray(value), false);
  return value as Record<string, unknown>;
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

function compiledModule(relativePath: string): string {
  return pathToFileURL(resolve('dist', relativePath)).href;
}

describe('ExerciseRecord HTTP E2E', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  let fixture: FoundationFixture;
  let student: ExerciseSessionStudentFixture;
  let sessionId: string;
  let mediaId: string;
  let baseUrl: string;

  const request = async (path: string, init: RequestInit = {}): Promise<HttpResult> => {
    const response = await fetch(`${baseUrl}${path}`, init);
    const text = await response.text();
    return {
      status: response.status,
      body: text.length === 0 ? {} : (JSON.parse(text) as Record<string, unknown>),
      headers: response.headers,
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
    student = await seedExerciseSessionStudent(prisma, fixture, 'RECORD-E2E');
    const now = new Date();
    const businessDate = new Date(`${now.toISOString().slice(0, 10)}T00:00:00.000Z`);
    sessionId = uuidv7();
    await prisma.exerciseSession.create({
      data: {
        id: sessionId,
        organizationId: fixture.organizationId,
        studentId: student.studentId,
        enrollmentId: student.enrollmentId,
        classSectionId: fixture.teacherAActiveSectionId,
        semesterId: fixture.semesterId,
        startedByAuthSessionId: student.authSessionId,
        status: 'COMPLETED',
        startedAt: new Date(now.getTime() - 3_600_000),
        businessDate,
        completedAt: now,
        endReason: 'USER_COMPLETED',
        actualDurationSeconds: 3600n,
        pausedDurationSeconds: 0n,
        createdAt: now,
        updatedAt: now,
      },
    });
    mediaId = uuidv7();
    await prisma.mediaEvidence.create({
      data: {
        id: mediaId,
        organizationId: fixture.organizationId,
        ownerStudentId: student.studentId,
        sessionId,
        initiatedByUserId: student.userId,
        businessPurpose: 'EXERCISE_RECORD',
        mediaType: 'IMAGE',
        captureSource: 'IN_APP_CAMERA',
        declaredMimeType: 'image/png',
        verifiedMimeType: 'image/png',
        declaredFileSizeBytes: 45n,
        verifiedFileSizeBytes: 45n,
        declaredContentSha256: 'b'.repeat(64),
        verifiedContentSha256: 'b'.repeat(64),
        uploadStatus: 'AVAILABLE',
        storageKey: `media/${fixture.organizationId}/${mediaId}/image`,
        uploadedAt: now,
        boundAt: now,
        processingStartedAt: now,
        availableAt: now,
        createdAt: now,
        updatedAt: now,
        version: 5,
      },
    });
  });

  after(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  const studentToken = async (): Promise<string> => {
    const seconds = Math.floor(Date.now() / 1000);
    return new SignJWT({
      organizationId: fixture.organizationId,
      role: 'STUDENT',
      sessionId: student.authSessionId,
      tokenVersion: 0,
    })
      .setProtectedHeader({ alg: 'EdDSA', typ: 'JWT' })
      .setSubject(student.userId)
      .setJti(uuidv7())
      .setIssuer('bnbu-sports-test')
      .setAudience('bnbu-sports-test-clients')
      .setIssuedAt(seconds)
      .setExpirationTime(seconds + 600)
      .sign(await importPKCS8(TEST_PRIVATE_KEY, 'EdDSA'));
  };

  const seedCompletedEvidence = async (actualDurationSeconds: number) => {
    const now = new Date();
    const seededSessionId = uuidv7();
    const seededMediaId = uuidv7();
    await prisma.exerciseSession.create({
      data: {
        id: seededSessionId,
        organizationId: fixture.organizationId,
        studentId: student.studentId,
        enrollmentId: student.enrollmentId,
        classSectionId: fixture.teacherAActiveSectionId,
        semesterId: fixture.semesterId,
        startedByAuthSessionId: student.authSessionId,
        status: 'COMPLETED',
        startedAt: new Date(now.getTime() - actualDurationSeconds * 1000),
        businessDate: new Date(`${now.toISOString().slice(0, 10)}T00:00:00.000Z`),
        completedAt: now,
        endReason: 'USER_COMPLETED',
        actualDurationSeconds: BigInt(actualDurationSeconds),
        pausedDurationSeconds: 0n,
        createdAt: now,
        updatedAt: now,
      },
    });
    await prisma.mediaEvidence.create({
      data: {
        id: seededMediaId,
        organizationId: fixture.organizationId,
        ownerStudentId: student.studentId,
        sessionId: seededSessionId,
        initiatedByUserId: student.userId,
        businessPurpose: 'EXERCISE_RECORD',
        mediaType: 'IMAGE',
        captureSource: 'IN_APP_CAMERA',
        declaredMimeType: 'image/png',
        verifiedMimeType: 'image/png',
        declaredFileSizeBytes: 45n,
        verifiedFileSizeBytes: 45n,
        declaredContentSha256: 'c'.repeat(64),
        verifiedContentSha256: 'c'.repeat(64),
        uploadStatus: 'AVAILABLE',
        storageKey: `media/${fixture.organizationId}/${seededMediaId}/image`,
        uploadedAt: now,
        boundAt: now,
        processingStartedAt: now,
        availableAt: now,
        createdAt: now,
        updatedAt: now,
        version: 5,
      },
    });
    return { sessionId: seededSessionId, mediaId: seededMediaId };
  };

  it('creates, edits, lists, submits, and replays one immutable evidence chain', async () => {
    const token = await studentToken();
    const createBody = {
      sessionId,
      creditType: 'GENERAL',
      sportType: 'RUNNING',
      description: 'Synthetic full record chain',
      clientRequestId: `android-${uuidv7()}`,
    };
    const createKey = uuidv7();
    const created = await request(
      '/api/v1/exercise-records',
      authenticated(token, 'POST', createBody, createKey),
    );
    const createReplay = await request(
      '/api/v1/exercise-records',
      authenticated(token, 'POST', createBody, createKey),
    );
    assert.equal(created.status, 201);
    assert.deepEqual(createReplay.body.data, created.body.data);
    const draft = object(created.body.data);
    const recordId = String(draft.id);
    assert.equal(draft.status, 'DRAFT');
    assert.equal(draft.actualDurationSeconds, 3600);
    assert.equal(draft.creditedDurationSeconds, 3600);
    assert.equal(draft.currentReview, null);

    const updated = await request(
      `/api/v1/exercise-records/${recordId}`,
      authenticated(
        token,
        'PATCH',
        { description: 'Updated synthetic record', expectedVersion: 1 },
        uuidv7(),
      ),
    );
    assert.equal(updated.status, 200);
    assert.equal(object(updated.body.data).version, 2);

    const submitted = await request(
      `/api/v1/exercise-records/${recordId}/submit`,
      authenticated(token, 'POST', { mediaIds: [mediaId], expectedVersion: 2 }, uuidv7()),
    );
    assert.equal(submitted.status, 200);
    const record = object(submitted.body.data);
    assert.equal(record.status, 'SUBMITTED');
    assert.equal(Object.hasOwn(record, 'studentRemark'), false);
    assert.deepEqual(record.currentReview, {
      result: 'PENDING',
      reasonCode: null,
      publicComment: null,
    });
    assert.equal(Object.hasOwn(record, 'internalNote'), false);
    assert.equal(await prisma.reviewRecord.count({ where: { recordId } }), 1);
    assert.equal(await prisma.exerciseRecordMedia.count({ where: { recordId } }), 1);
    assert.equal(await prisma.exerciseRecordDailySlot.count({ where: { recordId } }), 1);

    const evidenceContext = await request(
      `/api/v1/exercise-records/${recordId}/evidence-context`,
      authenticated(token),
    );
    assert.equal(evidenceContext.status, 200);
    const contextData = object(evidenceContext.body.data);
    assert.equal(contextData.recordId, recordId);
    assert.equal(contextData.sessionId, sessionId);
    assert.equal(typeof contextData.startedAt, 'string');
    assert.equal(typeof contextData.endedAt, 'string');
    assert.deepEqual(contextData.mediaIds, [mediaId]);

    const media = await request(`/api/v1/media/${mediaId}`, authenticated(token));
    assert.equal(media.status, 200);
    assert.equal(object(media.body.data).recordId, recordId);
    assert.equal(Object.hasOwn(object(media.body.data), 'storageKey'), false);
    const listed = await request('/api/v1/exercise-records?limit=20', authenticated(token));
    assert.equal(listed.status, 200);
    assert.equal((listed.body.data as unknown[]).length, 1);
  });

  it('requires the exact complete set of available session media', async () => {
    const token = await studentToken();
    const secondMediaId = uuidv7();
    const now = new Date();
    await prisma.mediaEvidence.create({
      data: {
        id: secondMediaId,
        organizationId: fixture.organizationId,
        ownerStudentId: student.studentId,
        sessionId,
        initiatedByUserId: student.userId,
        businessPurpose: 'EXERCISE_RECORD',
        mediaType: 'IMAGE',
        captureSource: 'IN_APP_CAMERA',
        declaredMimeType: 'image/png',
        verifiedMimeType: 'image/png',
        declaredFileSizeBytes: 45n,
        verifiedFileSizeBytes: 45n,
        verifiedContentSha256: 'd'.repeat(64),
        uploadStatus: 'AVAILABLE',
        storageKey: `media/${fixture.organizationId}/${secondMediaId}/image`,
        uploadedAt: now,
        boundAt: now,
        processingStartedAt: now,
        availableAt: now,
        createdAt: now,
        updatedAt: now,
        version: 5,
      },
    });
    const created = await request(
      '/api/v1/exercise-records',
      authenticated(
        token,
        'POST',
        {
          sessionId,
          creditType: 'COURSE_RELATED',
          sportType: 'RUNNING',
          clientRequestId: `android-${uuidv7()}`,
        },
        uuidv7(),
      ),
    );
    assert.equal(created.status, 201);
    const createdRecord = object(created.body.data);
    assert.equal(createdRecord.description, null);
    const recordId = String(createdRecord.id);
    const invalidGeneral = await request(
      `/api/v1/exercise-records/${recordId}`,
      authenticated(token, 'PATCH', { creditType: 'GENERAL', expectedVersion: 1 }, uuidv7()),
    );
    assert.equal(invalidGeneral.status, 422);
    assert.equal(invalidGeneral.body.code, 'VALIDATION_FAILED');
    const incomplete = await request(
      `/api/v1/exercise-records/${recordId}/submit`,
      authenticated(token, 'POST', { mediaIds: [mediaId], expectedVersion: 1 }, uuidv7()),
    );
    assert.equal(incomplete.status, 422);
    assert.equal(incomplete.body.code, 'EXERCISE_RECORD_MEDIA_INCOMPLETE');

    const submitted = await request(
      `/api/v1/exercise-records/${recordId}/submit`,
      authenticated(
        token,
        'POST',
        { mediaIds: [mediaId, secondMediaId].sort(), expectedVersion: 1 },
        uuidv7(),
      ),
    );
    assert.equal(submitted.status, 200);
    assert.equal(await prisma.exerciseRecordMedia.count({ where: { recordId } }), 2);
  });

  it('does not let an unselected processing upload block valid evidence submission', async () => {
    const token = await studentToken();
    const processingMediaId = uuidv7();
    const now = new Date();
    await prisma.mediaEvidence.create({
      data: {
        id: processingMediaId,
        organizationId: fixture.organizationId,
        ownerStudentId: student.studentId,
        sessionId,
        initiatedByUserId: student.userId,
        businessPurpose: 'EXERCISE_RECORD',
        mediaType: 'IMAGE',
        captureSource: 'IN_APP_CAMERA',
        declaredMimeType: 'image/png',
        verifiedMimeType: 'image/png',
        declaredFileSizeBytes: 45n,
        verifiedFileSizeBytes: 45n,
        verifiedContentSha256: 'e'.repeat(64),
        uploadStatus: 'PROCESSING',
        storageKey: `media/${fixture.organizationId}/${processingMediaId}/image`,
        uploadedAt: now,
        boundAt: now,
        processingStartedAt: now,
        createdAt: now,
        updatedAt: now,
        version: 4,
      },
    });
    const created = await request(
      '/api/v1/exercise-records',
      authenticated(
        token,
        'POST',
        {
          sessionId,
          creditType: 'GENERAL',
          sportType: 'RUNNING',
          description: 'Processing proof session',
          clientRequestId: `android-${uuidv7()}`,
        },
        uuidv7(),
      ),
    );
    assert.equal(created.status, 201);
    const recordId = String(object(created.body.data).id);
    const denied = await request(
      `/api/v1/exercise-records/${recordId}/submit`,
      authenticated(
        token,
        'POST',
        { mediaIds: [mediaId, processingMediaId].sort(), expectedVersion: 1 },
        uuidv7(),
      ),
    );
    assert.equal(denied.status, 422);
    assert.equal(denied.body.code, 'EXERCISE_RECORD_MEDIA_INCOMPLETE');

    const submitted = await request(
      `/api/v1/exercise-records/${recordId}/submit`,
      authenticated(token, 'POST', { mediaIds: [mediaId], expectedVersion: 1 }, uuidv7()),
    );
    assert.equal(submitted.status, 200);
    assert.equal(object(submitted.body.data).status, 'SUBMITTED');
  });

  it('returns a stable conflict when a second draft is created for one session', async () => {
    const token = await studentToken();
    const body = {
      sessionId,
      creditType: 'GENERAL',
      sportType: 'RUNNING',
      description: 'Synthetic duplicate draft',
      clientRequestId: `android-${uuidv7()}`,
    };
    const first = await request(
      '/api/v1/exercise-records',
      authenticated(token, 'POST', body, uuidv7()),
    );
    assert.equal(first.status, 201);
    const duplicate = await request(
      '/api/v1/exercise-records',
      authenticated(token, 'POST', { ...body, clientRequestId: `android-${uuidv7()}` }, uuidv7()),
    );
    assert.equal(duplicate.status, 409);
    assert.equal(duplicate.body.code, 'EXERCISE_RECORD_ALREADY_EXISTS_FOR_SESSION');
  });

  it('discards a draft atomically with append-only evidence', async () => {
    const token = await studentToken();
    const created = await request(
      '/api/v1/exercise-records',
      authenticated(
        token,
        'POST',
        {
          sessionId,
          creditType: 'GENERAL',
          sportType: 'RUNNING',
          description: 'Synthetic discard path',
          clientRequestId: `android-${uuidv7()}`,
        },
        uuidv7(),
      ),
    );
    assert.equal(created.status, 201);
    const draft = object(created.body.data);
    const recordId = String(draft.id);
    const discarded = await request(
      `/api/v1/exercise-records/${recordId}/discard`,
      authenticated(
        token,
        'POST',
        { reason: 'Synthetic student discard', expectedVersion: draft.version },
        uuidv7(),
      ),
    );
    assert.equal(discarded.status, 200, JSON.stringify(discarded.body));
    assert.equal(object(discarded.body.data).status, 'CANCELLED');
    assert.equal(
      await prisma.exerciseRecordEvent.count({ where: { recordId, eventType: 'DISCARDED' } }),
      1,
    );
    assert.equal(
      await prisma.auditLog.count({
        where: { targetId: recordId, actionType: 'EXERCISE_RECORD_DISCARDED' },
      }),
      1,
    );
  });

  it('routes withdrawal to stable default deny with zero domain side effects', async () => {
    const token = await studentToken();
    const created = await request(
      '/api/v1/exercise-records',
      authenticated(
        token,
        'POST',
        {
          sessionId,
          creditType: 'GENERAL',
          sportType: 'RUNNING',
          description: 'Synthetic withdrawal denial',
          clientRequestId: `android-${uuidv7()}`,
        },
        uuidv7(),
      ),
    );
    const draft = object(created.body.data);
    const recordId = String(draft.id);
    const before = {
      version: draft.version,
      events: await prisma.exerciseRecordEvent.count({ where: { recordId } }),
      audits: await prisma.auditLog.count({ where: { targetId: recordId } }),
      outbox: await prisma.outboxEvent.count({ where: { aggregateId: recordId } }),
    };
    const denied = await request(
      `/api/v1/exercise-records/${recordId}/withdraw`,
      authenticated(token, 'POST', { reason: 'Synthetic request', expectedVersion: 1 }, uuidv7()),
    );
    assert.equal(denied.status, 409);
    assert.equal(denied.body.code, 'EXERCISE_RECORD_WITHDRAWAL_NOT_ALLOWED');
    assert.equal(
      (await prisma.exerciseRecord.findUniqueOrThrow({ where: { id: recordId } })).version,
      before.version,
    );
    assert.equal(await prisma.exerciseRecordEvent.count({ where: { recordId } }), before.events);
    assert.equal(await prisma.auditLog.count({ where: { targetId: recordId } }), before.audits);
    assert.equal(
      await prisma.outboxEvent.count({ where: { aggregateId: recordId } }),
      before.outbox,
    );
  });

  it('keeps sub-hour drafts non-creditable and rolls submission back completely', async () => {
    const token = await studentToken();
    const evidence = await seedCompletedEvidence(3599);
    const created = await request(
      '/api/v1/exercise-records',
      authenticated(
        token,
        'POST',
        {
          sessionId: evidence.sessionId,
          creditType: 'GENERAL',
          sportType: 'RUNNING',
          description: 'Synthetic short session',
          clientRequestId: `android-${uuidv7()}`,
        },
        uuidv7(),
      ),
    );
    assert.equal(created.status, 201);
    const draft = object(created.body.data);
    assert.equal(draft.creditedDurationSeconds, 0);
    const denied = await request(
      `/api/v1/exercise-records/${String(draft.id)}/submit`,
      authenticated(token, 'POST', { mediaIds: [evidence.mediaId], expectedVersion: 1 }, uuidv7()),
    );
    assert.equal(denied.status, 422);
    assert.equal(denied.body.code, 'EXERCISE_RECORD_DURATION_NOT_CREDITABLE');
    assert.equal(await prisma.exerciseRecordDailySlot.count(), 0);
    assert.equal(await prisma.exerciseRecordMedia.count(), 0);
    assert.equal(await prisma.reviewRecord.count(), 0);
  });

  it('reserves one successful submission per enrollment business date', async () => {
    const token = await studentToken();
    const createDraft = async (candidateSessionId: string) => {
      const created = await request(
        '/api/v1/exercise-records',
        authenticated(
          token,
          'POST',
          {
            sessionId: candidateSessionId,
            creditType: 'GENERAL',
            sportType: 'RUNNING',
            description: 'Synthetic daily reservation',
            clientRequestId: `android-${uuidv7()}`,
          },
          uuidv7(),
        ),
      );
      assert.equal(created.status, 201);
      return String(object(created.body.data).id);
    };
    const submit = async (recordId: string, candidateMediaId: string) =>
      request(
        `/api/v1/exercise-records/${recordId}/submit`,
        authenticated(
          token,
          'POST',
          { mediaIds: [candidateMediaId], expectedVersion: 1 },
          uuidv7(),
        ),
      );
    const second = await seedCompletedEvidence(3600);
    const candidates = [
      { recordId: await createDraft(sessionId), mediaId },
      { recordId: await createDraft(second.sessionId), mediaId: second.mediaId },
    ];
    const results = await Promise.all(
      candidates.map(async (candidate) => ({
        ...candidate,
        response: await submit(candidate.recordId, candidate.mediaId),
      })),
    );
    const successful = results.filter((result) => result.response.status === 200);
    const denied = results.filter((result) => result.response.status === 409);
    const outcomeSummary = results.map((result) => ({
      status: result.response.status,
      code: result.response.body.code,
    }));
    assert.equal(successful.length, 1, JSON.stringify(outcomeSummary));
    assert.equal(denied.length, 1, JSON.stringify(outcomeSummary));
    const duplicate = denied[0];
    assert.ok(duplicate !== undefined);
    assert.equal(duplicate.response.body.code, 'EXERCISE_RECORD_DAILY_LIMIT_REACHED');
    const persisted = await prisma.exerciseRecord.findUniqueOrThrow({
      where: { id: duplicate.recordId },
    });
    assert.equal(persisted.status, 'DRAFT');
    assert.equal(persisted.version, 1);
    assert.equal(await prisma.reviewRecord.count({ where: { recordId: duplicate.recordId } }), 0);
    assert.equal(
      await prisma.exerciseRecordMedia.count({ where: { recordId: duplicate.recordId } }),
      0,
    );
  });
});
