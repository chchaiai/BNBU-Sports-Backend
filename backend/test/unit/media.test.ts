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

function mp4(
  durationMilliseconds: number,
  options: { hasAudio?: boolean; spoofAudioInMediaData?: boolean } = {},
): Buffer {
  const box = (type: string, payload: Buffer): Buffer => {
    const value = Buffer.alloc(8 + payload.length);
    value.writeUInt32BE(value.length, 0);
    value.write(type, 4, 'ascii');
    payload.copy(value, 8);
    return value;
  };
  const fileTypePayload = Buffer.alloc(16);
  fileTypePayload.write('isom', 0, 'ascii');
  fileTypePayload.write('isom', 8, 'ascii');
  const movieHeaderPayload = Buffer.alloc(36);
  movieHeaderPayload.writeUInt32BE(1_000, 12);
  movieHeaderPayload.writeUInt32BE(durationMilliseconds, 16);
  const handlerPayload = Buffer.alloc(24);
  handlerPayload.write(options.hasAudio === false ? 'vide' : 'soun', 8, 'ascii');
  const media = box('mdia', box('hdlr', handlerPayload));
  const movie = box('moov', Buffer.concat([box('mvhd', movieHeaderPayload), box('trak', media)]));
  const mediaDataPayload = options.spoofAudioInMediaData
    ? Buffer.from([
        0, 0, 0, 32, 0x68, 0x64, 0x6c, 0x72, 0, 0, 0, 0, 0, 0, 0, 0, 0x73, 0x6f, 0x75, 0x6e,
      ])
    : Buffer.alloc(4);
  return Buffer.concat([box('ftyp', fileTypePayload), movie, box('mdat', mediaDataPayload)]);
}

describe('MediaEvidence validation core', () => {
  it('separates declarations from verified image facts and computes SHA-256 from bytes', async () => {
    const body = png();
    const digest = createHash('sha256').update(body).digest('hex');
    const validator = new MediaValidator();
    const verified = await validator.readAndVerify(
      Readable.from(body),
      {
        businessPurpose: 'EXERCISE_RECORD',
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
            businessPurpose: 'EXERCISE_RECORD',
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

  it('keeps image limits while replacing exercise-video size rules with a fixed 15-second cap', () => {
    const validator = new MediaValidator();
    assert.throws(
      () =>
        validator.validateDeclaration(
          {
            businessPurpose: 'EXERCISE_RECORD',
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
          businessPurpose: 'EXERCISE_RECORD',
          mediaType: 'VIDEO',
          mimeType: 'video/mp4',
          fileSizeBytes: 100,
          contentSha256: null,
          durationSeconds: null,
        },
        config,
      ),
    );
    assert.doesNotThrow(() =>
      validator.validateDeclaration(
        {
          businessPurpose: 'EXERCISE_RECORD',
          mediaType: 'VIDEO',
          mimeType: 'video/quicktime',
          fileSizeBytes: 250_000_000,
          contentSha256: null,
          durationSeconds: 15,
        },
        config,
      ),
    );
    assert.throws(
      () =>
        validator.validateDeclaration(
          {
            businessPurpose: 'EXERCISE_RECORD',
            mediaType: 'VIDEO',
            mimeType: 'video/mp4',
            fileSizeBytes: 1,
            contentSha256: null,
            durationSeconds: 16,
          },
          config,
        ),
      (error: unknown) =>
        error instanceof ApplicationError && error.code === 'MEDIA_VIDEO_DURATION_EXCEEDED',
    );
  });

  it('streams video verification and enforces the trusted duration at the exact boundary', async () => {
    const validator = new MediaValidator();
    const accepted = mp4(15_000);
    const verified = await validator.readAndVerify(
      Readable.from([accepted.subarray(0, 37), accepted.subarray(37)]),
      {
        businessPurpose: 'EXERCISE_RECORD',
        mediaType: 'VIDEO',
        mimeType: 'video/mp4',
        fileSizeBytes: accepted.length,
        contentSha256: createHash('sha256').update(accepted).digest('hex'),
        durationSeconds: 15,
      },
      config,
    );
    assert.equal(verified.durationSeconds, 15);
    assert.deepEqual(verified.safeMetadata, { durationSeconds: 15, audioTrackCount: 1 });

    const rejected = mp4(15_001);
    await assert.rejects(
      validator.readAndVerify(
        Readable.from(rejected),
        {
          businessPurpose: 'EXERCISE_RECORD',
          mediaType: 'VIDEO',
          mimeType: 'video/mp4',
          fileSizeBytes: rejected.length,
          contentSha256: null,
          durationSeconds: 16,
        },
        config,
      ),
      (error: unknown) =>
        error instanceof ApplicationError && error.code === 'MEDIA_VIDEO_DURATION_EXCEEDED',
    );
  });

  it('rejects an exercise video without a trusted audio track', async () => {
    const validator = new MediaValidator();
    const silent = mp4(8_000, { hasAudio: false, spoofAudioInMediaData: true });
    await assert.rejects(
      validator.readAndVerify(
        Readable.from([silent.subarray(0, 73), silent.subarray(73)]),
        {
          businessPurpose: 'EXERCISE_RECORD',
          mediaType: 'VIDEO',
          mimeType: 'video/mp4',
          fileSizeBytes: silent.length,
          contentSha256: createHash('sha256').update(silent).digest('hex'),
          durationSeconds: 8,
        },
        config,
      ),
      (error: unknown) =>
        error instanceof ApplicationError && error.code === 'MEDIA_AUDIO_TRACK_REQUIRED',
    );

    const nonExercise = await validator.readAndVerify(
      Readable.from(silent),
      {
        businessPurpose: 'EXEMPTION_APPLICATION',
        mediaType: 'VIDEO',
        mimeType: 'video/mp4',
        fileSizeBytes: silent.length,
        contentSha256: null,
        durationSeconds: 8,
      },
      config,
    );
    assert.deepEqual(nonExercise.safeMetadata, { durationSeconds: 8, audioTrackCount: 0 });
  });
});
