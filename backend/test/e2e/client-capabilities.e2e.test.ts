import assert from 'node:assert/strict';
import { createServer } from 'node:net';
import { after, before, describe, it } from 'node:test';

import { ValidationPipe, type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import { HttpExceptionFilter } from '../../src/common/errors/http-exception.filter.js';
import { validationException } from '../../src/common/http/validation.js';
import { SystemClock } from '../../src/common/time/clock.js';
import { ClientCapabilitiesModule } from '../../src/modules/client-capabilities/client-capabilities.module.js';

async function availablePort(): Promise<number> {
  const server = createServer();
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const address = server.address();
  assert.ok(address && typeof address === 'object');
  await new Promise<void>((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
  return address.port;
}

describe('Stage 21 client capability HTTP routes', () => {
  let app: INestApplication;
  let baseUrl: string;

  before(async () => {
    const module = await Test.createTestingModule({
      imports: [ClientCapabilitiesModule],
    }).compile();
    app = module.createNestApplication();
    app.useGlobalFilters(new HttpExceptionFilter(new SystemClock()));
    app.use(
      (request: { principal?: Record<string, unknown> }, _response: unknown, next: () => void) => {
        request.principal = {
          userId: '0198c74b-7dc0-7000-8000-000000000001',
          organizationId: '0198c74b-7dc0-7000-8000-000000000002',
          role: 'STUDENT',
          sessionId: '0198c74b-7dc0-7000-8000-000000000003',
          tokenVersion: 0,
          jti: '0198c74b-7dc0-7000-8000-000000000004',
        };
        next();
      },
    );
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
    const port = await availablePort();
    await app.listen(port, '127.0.0.1');
    baseUrl = `http://127.0.0.1:${port}`;
  });

  after(async () => app.close());

  it('routes a valid public capability request to exact stable default deny', async () => {
    const response = await fetch(`${baseUrl}/api/v1/auth/student-sign-in-codes`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-request-id': 'stage21-public' },
      body: JSON.stringify({
        account: 'synthetic@invalid.test',
        channel: 'EMAIL',
        locale: 'zh-CN',
      }),
    });
    assert.equal(response.status, 503);
    const body = (await response.json()) as Record<string, unknown>;
    assert.equal(body.code, 'SYSTEM_MODE_UNSUPPORTED');
  });

  it('routes valid GPS samples to the same exact boundary without persisting them', async () => {
    const sessionId = '0198c74b-7dc0-7000-8000-000000000010';
    const response = await fetch(
      `${baseUrl}/api/v1/exercise-sessions/${sessionId}/location-samples`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-request-id': 'stage21-gps' },
        body: JSON.stringify({
          samples: [
            {
              sampleId: '0198c74b-7dc0-7000-8000-000000000011',
              observedAt: '2026-08-05T12:00:00Z',
              latitude: 22.3,
              longitude: 114.2,
              accuracyMeters: 10,
            },
          ],
          expectedVersion: 1,
        }),
      },
    );
    assert.equal(response.status, 503);
    const body = (await response.json()) as Record<string, unknown>;
    assert.equal(body.code, 'SYSTEM_MODE_UNSUPPORTED');
  });
});
