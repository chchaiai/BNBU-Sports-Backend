import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { Readable } from 'node:stream';
import { describe, it } from 'node:test';

import type { MediaConfig } from '../../src/common/config/environment.js';
import { ApplicationError } from '../../src/common/errors/application-error.js';
import { MediaValidator } from '../../src/modules/media/application/media-validator.js';

const config: MediaConfig = {
  storage: {
    endpoint: 'http://storage.test:9000',
    region: 'us-east-1',
    bucket: 'synthetic-media-private',
    accessKey: 'synthetic-access',
    secretKey: 'synthetic-secret-never-production',
    forcePathStyle: true,
  },
  uploadUrlTtlSeconds: 300,
  accessUrlTtlSeconds: 300,
  maxImageBytes: 10_000,
  maxVideoBytes: 10_000,
  maxVideoDurationSeconds: 300,
  maxImagePixels: 1_000_000,
  scannerMode: 'TEST_SIGNATURE',
  workerEnabled: false,
  workerPollMs: 500,
};

function png(width = 2, height = 3): Buffer {
  const header = Buffer.alloc(33);
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]).copy(header, 0);
  header.writeUInt32BE(13, 8);
  header.write('IHDR', 12, 'ascii');
  header.writeUInt32BE(width, 16);
  header.writeUInt32BE(height, 20);
  header[24] = 8;
  header[25] = 2;
  header.writeUInt32BE(0, 29);
  return Buffer.concat([header, Buffer.from([0, 0, 0, 0, 73, 69, 78, 68, 0, 0, 0, 0])]);
}

describe('MediaEvidence validation core', () => {
  it('separates declarations from verified image facts and computes SHA-256 from bytes', async () => {
    const body = png();
    const digest = createHash('sha256').update(body).digest('hex');
    const validator = new MediaValidator();
    const verified = await validator.readAndVerify(
      Readable.from(body),
      {
        mediaType: 'IMAGE',
        mimeType: 'image/png',
        fileSizeBytes: body.length,
        contentSha256: digest,
        durationSeconds: null,
      },
      config,
    );
    assert.equal(verified.mimeType, 'image/png');
    assert.equal(verified.fileSizeBytes, body.length);
    assert.equal(verified.contentSha256, digest);
    assert.equal(verified.durationSeconds, null);
    assert.deepEqual(verified.safeMetadata, { width: 2, height: 3 });
  });

  it('rejects MIME spoofing, byte-size mismatches, location metadata, and the test signature', async () => {
    const validator = new MediaValidator();
    for (const [body, mimeType, size] of [
      [png(), 'image/jpeg', png().length],
      [png(), 'image/png', png().length + 1],
      [Buffer.concat([png(), Buffer.from('GPS')]), 'image/png', png().length + 3],
      [
        Buffer.concat([png(), Buffer.from('EICAR-STANDARD-ANTIVIRUS-TEST-FILE')]),
        'image/png',
        png().length + 34,
      ],
    ] as const) {
      await assert.rejects(
        validator.readAndVerify(
          Readable.from(body),
          {
            mediaType: 'IMAGE',
            mimeType,
            fileSizeBytes: size,
            contentSha256: null,
            durationSeconds: null,
          },
          config,
        ),
        (error: unknown) =>
          error instanceof ApplicationError && error.code === 'MEDIA_INTEGRITY_MISMATCH',
      );
    }
  });

  it('enforces V1 MIME, size, and conditional duration declarations', () => {
    const validator = new MediaValidator();
    assert.throws(
      () =>
        validator.validateDeclaration(
          {
            mediaType: 'IMAGE',
            mimeType: 'image/gif',
            fileSizeBytes: 100,
            contentSha256: null,
            durationSeconds: null,
          },
          config,
        ),
      (error: unknown) =>
        error instanceof ApplicationError && error.code === 'MEDIA_TYPE_NOT_ALLOWED',
    );
    assert.throws(() =>
      validator.validateDeclaration(
        {
          mediaType: 'VIDEO',
          mimeType: 'video/mp4',
          fileSizeBytes: 100,
          contentSha256: null,
          durationSeconds: null,
        },
        config,
      ),
    );
  });
});
