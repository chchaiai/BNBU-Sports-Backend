import assert from 'node:assert/strict';
import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import { createServer } from 'node:net';
import { after, before, beforeEach, describe, it } from 'node:test';

import { importPKCS8, SignJWT } from 'jose';
import { v7 as uuidv7 } from 'uuid';

import type { PrismaClient } from '../../src/generated/prisma/client.js';
import {
  createTestPrisma,
  resetFoundationDatabase,
  seedFoundationFixture,
  type FoundationFixture,
} from '../helpers/database.js';
import {
  foundationEnvironment,
  requireTestDatabaseUrl,
  TEST_PASSWORD,
  TEST_PRIVATE_KEY,
} from '../helpers/test-environment.js';

interface HttpResult {
  status: number;
  headers: Headers;
  body: Record<string, unknown>;
}

interface AuthData {
  sessionId: string;
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  accessTokenExpiresAt: string;
  refreshTokenExpiresAt: string;
  user: { id: string; organizationId: string; role: string; primaryEmailMasked: string | null };
}

function asObject(value: unknown): Record<string, unknown> {
  assert.equal(typeof value, 'object');
  assert.notEqual(value, null);
  assert.equal(Array.isArray(value), false);
  return value as Record<string, unknown>;
}

async function availablePort(): Promise<number> {
  const server = createServer();
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const address = server.address();
  assert.notEqual(address, null);
  assert.equal(typeof address, 'object');
  const port = (address as { port: number }).port;
  await new Promise<void>((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
  return port;
}

describe('Foundation HTTP E2E with real PostgreSQL', () => {
  let prisma: PrismaClient;
  let fixture: FoundationFixture;
  let child: ChildProcessWithoutNullStreams;
  let baseUrl: string;
  let childOutput = '';

  const request = async (path: string, init: RequestInit = {}): Promise<HttpResult> => {
    const response = await fetch(`${baseUrl}${path}`, init);
    const text = await response.text();
    return {
      status: response.status,
      headers: response.headers,
      body: text.length === 0 ? {} : (JSON.parse(text) as Record<string, unknown>),
    };
  };

  const login = async (
    idempotencyKey = uuidv7(),
  ): Promise<{ result: HttpResult; data: AuthData }> => {
    const result = await request('/api/v1/auth/password-login', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'idempotency-key': idempotencyKey },
      body: JSON.stringify({ account: fixture.teacherEmail, password: TEST_PASSWORD }),
    });
    const data = asObject(result.body.data) as unknown as AuthData;
    return { result, data };
  };

  before(async () => {
    const databaseUrl = requireTestDatabaseUrl();
    prisma = createTestPrisma(databaseUrl);
    await resetFoundationDatabase(prisma);
    await seedFoundationFixture(prisma);
    const port = await availablePort();
    baseUrl = `http://127.0.0.1:${port}`;
    child = spawn(process.execPath, ['--enable-source-maps', 'dist/main.js'], {
      cwd: new URL('../..', import.meta.url),
      env: foundationEnvironment(databaseUrl, port),
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    child.stdout.on('data', (chunk: Buffer) => (childOutput += chunk.toString()));
    child.stderr.on('data', (chunk: Buffer) => (childOutput += chunk.toString()));

    const deadline = Date.now() + 20_000;
    while (Date.now() < deadline) {
      if (child.exitCode !== null) throw new Error(`Backend exited during startup: ${childOutput}`);
      try {
        const response = await fetch(`${baseUrl}/api/v1/health/live`);
        if (response.ok) return;
      } catch {
        // The process may still be starting.
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    throw new Error(`Backend did not become live: ${childOutput}`);
  });

  beforeEach(async () => {
    await resetFoundationDatabase(prisma);
    fixture = await seedFoundationFixture(prisma);
  });

  after(async () => {
    child.kill();
    await prisma.$disconnect();
  });

  it('serves liveness, readiness, and the minimal persisted SystemMode', async () => {
    const live = await request('/api/v1/health/live');
    assert.equal(live.status, 200);
    assert.deepEqual(Object.keys(live.body).sort(), ['data', 'meta']);
    const ready = await request('/api/v1/health/ready');
    assert.equal(ready.status, 200);
    const mode = await request('/api/v1/system-mode');
    assert.equal(mode.status, 200);
    assert.equal(asObject(mode.body.data).mode, 'NORMAL');
  });

  it('logs in only with the seeded password and returns a safe /me projection', async () => {
    const { result, data } = await login();
    assert.equal(result.status, 200);
    assert.equal(data.tokenType, 'Bearer');
    assert.equal(data.user.role, 'TEACHER');
    assert.match(data.user.primaryEmailMasked ?? '', /^t\*\*\*@/);
    assert.equal(JSON.stringify(result.body).includes(TEST_PASSWORD), false);

    const me = await request('/api/v1/me', {
      headers: { authorization: `Bearer ${data.accessToken}`, 'x-request-id': 'req-me-safe' },
    });
    assert.equal(me.status, 200);
    assert.equal(me.headers.get('x-request-id'), 'req-me-safe');
    assert.equal(asObject(me.body.meta).requestId, 'req-me-safe');
    const current = asObject(me.body.data);
    assert.equal(current.studentProfile, null);
    assert.notEqual(current.teacherProfile, null);
    assert.equal(JSON.stringify(me.body).includes('passwordHash'), false);
    assert.equal(JSON.stringify(me.body).includes('tokenVersion'), false);

    assert.equal(await prisma.authSession.count(), 1);
    assert.equal(await prisma.refreshToken.count(), 1);
    assert.equal(
      await prisma.auditLog.count({ where: { actionType: 'AUTHENTICATION_SUCCEEDED' } }),
      1,
    );
    assert.equal(
      await prisma.outboxEvent.count({ where: { eventType: 'AUTH_SESSION_CREATED' } }),
      1,
    );
    const idempotency = await prisma.idempotencyRecord.findFirstOrThrow();
    assert.equal(idempotency.status, 'COMPLETED');
    assert.equal(idempotency.responseBodyEncryptedOrReference?.includes(data.accessToken), false);
    assert.equal(
      (await prisma.refreshToken.findFirstOrThrow()).tokenHash.includes(data.refreshToken),
      false,
    );
  });

  it('returns stable generic errors for wrong passwords and a specific disabled-account result', async () => {
    const wrong = await request('/api/v1/auth/password-login', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'idempotency-key': uuidv7() },
      body: JSON.stringify({ account: fixture.teacherEmail, password: 'wrong-password' }),
    });
    assert.equal(wrong.status, 401);
    assert.equal(wrong.body.code, 'AUTH_CREDENTIAL_INVALID');
    assert.deepEqual(Object.keys(wrong.body).sort(), [
      'code',
      'details',
      'message',
      'requestId',
      'timestamp',
    ]);

    await prisma.user.update({
      where: { id: fixture.teacherUserId },
      data: { status: 'DISABLED' },
    });
    const disabled = await request('/api/v1/auth/password-login', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'idempotency-key': uuidv7() },
      body: JSON.stringify({ account: fixture.teacherEmail, password: TEST_PASSWORD }),
    });
    assert.equal(disabled.status, 401);
    assert.equal(disabled.body.code, 'AUTH_ACCOUNT_DISABLED');
  });

  it('rejects expired, tampered, and cross-organization access tokens', async () => {
    const { data } = await login();
    const signatureStart = data.accessToken.lastIndexOf('.') + 1;
    const signatureFirstCharacter = data.accessToken[signatureStart];
    assert.notEqual(signatureFirstCharacter, undefined);
    const tampered = `${data.accessToken.slice(0, signatureStart)}${
      signatureFirstCharacter === 'a' ? 'b' : 'a'
    }${data.accessToken.slice(signatureStart + 1)}`;
    assert.equal(
      (await request('/api/v1/me', { headers: { authorization: `Bearer ${tampered}` } })).status,
      401,
    );

    const key = await importPKCS8(TEST_PRIVATE_KEY, 'EdDSA');
    const nowSeconds = Math.floor(Date.now() / 1_000);
    const expired = await new SignJWT({
      organizationId: fixture.organizationId,
      role: 'TEACHER',
      sessionId: data.sessionId,
      tokenVersion: 0,
    })
      .setProtectedHeader({ alg: 'EdDSA', typ: 'JWT' })
      .setSubject(fixture.teacherUserId)
      .setJti(uuidv7())
      .setIssuer('bnbu-sports-test')
      .setAudience('bnbu-sports-test-clients')
      .setIssuedAt(nowSeconds - 120)
      .setExpirationTime(nowSeconds - 60)
      .sign(key);
    const expiredResult = await request('/api/v1/me', {
      headers: { authorization: `Bearer ${expired}` },
    });
    assert.equal(expiredResult.body.code, 'AUTH_TOKEN_EXPIRED');

    const crossOrganization = await new SignJWT({
      organizationId: uuidv7(),
      role: 'TEACHER',
      sessionId: data.sessionId,
      tokenVersion: 0,
    })
      .setProtectedHeader({ alg: 'EdDSA', typ: 'JWT' })
      .setSubject(fixture.teacherUserId)
      .setJti(uuidv7())
      .setIssuer('bnbu-sports-test')
      .setAudience('bnbu-sports-test-clients')
      .setIssuedAt(nowSeconds)
      .setExpirationTime(nowSeconds + 60)
      .sign(key);
    const crossResult = await request('/api/v1/me', {
      headers: { authorization: `Bearer ${crossOrganization}` },
    });
    assert.equal(crossResult.status, 401);
    assert.equal(crossResult.body.code, 'AUTH_TOKEN_INVALID');
  });

  it('rotates refresh tokens atomically and revokes the family on reuse', async () => {
    const { data } = await login();
    const rotated = await request('/api/v1/auth/refresh', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'idempotency-key': uuidv7() },
      body: JSON.stringify({ refreshToken: data.refreshToken }),
    });
    assert.equal(rotated.status, 200);
    const next = asObject(rotated.body.data) as unknown as AuthData;
    assert.notEqual(next.refreshToken, data.refreshToken);
    assert.equal(await prisma.refreshToken.count(), 2);

    const replay = await request('/api/v1/auth/refresh', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'idempotency-key': uuidv7() },
      body: JSON.stringify({ refreshToken: data.refreshToken }),
    });
    assert.equal(replay.status, 401);
    assert.equal(replay.body.code, 'AUTH_SESSION_REVOKED');
    assert.equal(
      (await prisma.authSession.findUniqueOrThrow({ where: { id: data.sessionId } })).status,
      'REVOKED',
    );
    assert.notEqual(
      (
        await prisma.refreshToken.findFirstOrThrow({
          where: { authSessionId: data.sessionId, parentTokenId: null },
        })
      ).reuseDetectedAt,
      null,
    );

    const afterReuse = await request('/api/v1/auth/refresh', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'idempotency-key': uuidv7() },
      body: JSON.stringify({ refreshToken: next.refreshToken }),
    });
    assert.equal(afterReuse.status, 401);
  });

  it('revokes logout sessions and makes the operation safely replayable', async () => {
    const key = uuidv7();
    const { data } = await login();
    const logoutRequest: RequestInit = {
      method: 'POST',
      headers: {
        authorization: `Bearer ${data.accessToken}`,
        'content-type': 'application/json',
        'idempotency-key': key,
      },
      body: JSON.stringify({ refreshToken: data.refreshToken }),
    };
    const first = await request('/api/v1/auth/logout', logoutRequest);
    const replay = await request('/api/v1/auth/logout', logoutRequest);
    assert.equal(first.status, 200);
    assert.equal(replay.status, 200);
    assert.equal(first.body.data, null);
    assert.equal(
      (await prisma.authSession.findUniqueOrThrow({ where: { id: data.sessionId } })).status,
      'REVOKED',
    );

    const refresh = await request('/api/v1/auth/refresh', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'idempotency-key': uuidv7() },
      body: JSON.stringify({ refreshToken: data.refreshToken }),
    });
    assert.equal(refresh.status, 401);
  });

  it('reserves concurrent idempotency keys without creating duplicate sessions', async () => {
    const key = uuidv7();
    const init: RequestInit = {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'idempotency-key': key },
      body: JSON.stringify({ account: fixture.teacherEmail, password: TEST_PASSWORD }),
    };
    const [left, right] = await Promise.all([
      request('/api/v1/auth/password-login', init),
      request('/api/v1/auth/password-login', init),
    ]);
    assert.ok([200, 409].includes(left.status));
    assert.ok([200, 409].includes(right.status));
    assert.ok(left.status === 200 || right.status === 200);
    assert.equal(await prisma.authSession.count(), 1);
    assert.equal(await prisma.idempotencyRecord.count(), 1);

    const stable = await request('/api/v1/auth/password-login', init);
    assert.equal(stable.status, 200);
    const changed = await request('/api/v1/auth/password-login', {
      ...init,
      body: JSON.stringify({ account: fixture.teacherEmail, password: `${TEST_PASSWORD}!` }),
    });
    assert.equal(changed.status, 401);
  });

  it('enforces mode allowlists, strict validation, request IDs, CORS, and body limits', async () => {
    await prisma.systemPolicy.updateMany({
      data: { systemMode: 'READ_ONLY', version: { increment: 1 } },
    });
    assert.equal((await login()).result.status, 200);
    await prisma.systemPolicy.updateMany({
      data: { systemMode: 'MAINTENANCE', version: { increment: 1 } },
    });
    const maintenance = await request('/api/v1/auth/password-login', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'idempotency-key': uuidv7() },
      body: JSON.stringify({ account: fixture.teacherEmail, password: TEST_PASSWORD }),
    });
    assert.equal(maintenance.status, 503);
    assert.equal(maintenance.body.code, 'SYSTEM_MAINTENANCE');

    await prisma.systemPolicy.updateMany({
      data: { systemMode: 'NORMAL', version: { increment: 1 } },
    });
    const extraRole = await request('/api/v1/auth/password-login', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'idempotency-key': uuidv7() },
      body: JSON.stringify({
        account: fixture.teacherEmail,
        password: TEST_PASSWORD,
        role: 'ADMIN',
      }),
    });
    assert.equal(extraRole.status, 422);

    const invalidRequestId = await request('/api/v1/health/live', {
      headers: { 'x-request-id': 'invalid request id' },
    });
    const generated = invalidRequestId.headers.get('x-request-id');
    assert.match(generated ?? '', /^[0-9a-f-]{36}$/);
    assert.equal(asObject(invalidRequestId.body.meta).requestId, generated);

    const cors = await request('/api/v1/health/live', {
      headers: { origin: 'https://denied.test' },
    });
    assert.equal(cors.headers.get('access-control-allow-origin'), null);

    const oversized = await request('/api/v1/auth/password-login', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'idempotency-key': uuidv7() },
      body: JSON.stringify({ padding: 'x'.repeat(3_000) }),
    });
    assert.equal(oversized.status, 422);
    assert.deepEqual(Object.keys(oversized.body).sort(), [
      'code',
      'details',
      'message',
      'requestId',
      'timestamp',
    ]);
  });
});
