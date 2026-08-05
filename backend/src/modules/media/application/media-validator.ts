import { createHash } from 'node:crypto';
import type { Readable } from 'node:stream';

import { Injectable } from '@nestjs/common';

import type { MediaConfig } from '../../../common/config/environment.js';
import { ApplicationError } from '../../../common/errors/application-error.js';

export interface DeclaredMediaFacts {
  mediaType: string;
  mimeType: string;
  fileSizeBytes: number;
  contentSha256: string | null;
  durationSeconds: number | null;
}

export interface VerifiedMediaFacts {
  mimeType: string;
  fileSizeBytes: number;
  contentSha256: string;
  durationSeconds: number | null;
  safeMetadata: Record<string, number>;
}

const IMAGE_MIME = new Set(['image/jpeg', 'image/png']);
const VIDEO_MIME = new Set(['video/mp4']);
const EICAR = Buffer.from('EICAR-STANDARD-ANTIVIRUS-TEST-FILE', 'ascii');

@Injectable()
export class MediaValidator {
  validateDeclaration(facts: DeclaredMediaFacts, config: MediaConfig): void {
    const mimeType = facts.mimeType.toLowerCase();
    const allowed = facts.mediaType === 'IMAGE' ? IMAGE_MIME : VIDEO_MIME;
    if (!allowed.has(mimeType)) throw new ApplicationError('MEDIA_TYPE_NOT_ALLOWED', 415);
    const maximum = facts.mediaType === 'IMAGE' ? config.maxImageBytes : config.maxVideoBytes;
    if (!Number.isSafeInteger(facts.fileSizeBytes) || facts.fileSizeBytes > maximum) {
      throw new ApplicationError('MEDIA_SIZE_EXCEEDED', 413);
    }
    if (
      (facts.mediaType === 'IMAGE' && facts.durationSeconds !== null) ||
      (facts.mediaType === 'VIDEO' &&
        (facts.durationSeconds === null ||
          facts.durationSeconds < 1 ||
          facts.durationSeconds > config.maxVideoDurationSeconds))
    ) {
      throw new ApplicationError('VALIDATION_FAILED', 422);
    }
  }

  async readAndVerify(
    stream: Readable,
    declared: DeclaredMediaFacts,
    config: MediaConfig,
  ): Promise<VerifiedMediaFacts> {
    const maximum = declared.mediaType === 'IMAGE' ? config.maxImageBytes : config.maxVideoBytes;
    const chunks: Buffer[] = [];
    let length = 0;
    for await (const chunk of stream) {
      const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as Uint8Array);
      length += buffer.length;
      if (length > maximum) throw new ApplicationError('MEDIA_SIZE_EXCEEDED', 413);
      chunks.push(buffer);
    }
    const body = Buffer.concat(chunks, length);
    if (length !== declared.fileSizeBytes) this.integrityFailure();
    const digest = createHash('sha256').update(body).digest('hex');
    if (declared.contentSha256 !== null && declared.contentSha256 !== digest) {
      this.integrityFailure();
    }
    if (config.scannerMode === 'EXTERNAL_REQUIRED') {
      throw new ApplicationError('SYSTEM_SERVICE_UNAVAILABLE', 503, {
        dependency: 'MEDIA_SCANNER',
      });
    }
    if (body.includes(EICAR)) this.integrityFailure();

    const parsed =
      declared.mediaType === 'IMAGE'
        ? this.parseImage(body, config.maxImagePixels)
        : this.parseVideo(body, config.maxVideoDurationSeconds);
    if (parsed.mimeType !== declared.mimeType.toLowerCase()) this.integrityFailure();
    if (
      declared.mediaType === 'VIDEO' &&
      (declared.durationSeconds === null || parsed.durationSeconds !== declared.durationSeconds)
    ) {
      this.integrityFailure();
    }
    return {
      mimeType: parsed.mimeType,
      fileSizeBytes: length,
      contentSha256: digest,
      durationSeconds: parsed.durationSeconds,
      safeMetadata: parsed.safeMetadata,
    };
  }

  private parseImage(
    body: Buffer,
    maximumPixels: number,
  ): { mimeType: string; durationSeconds: null; safeMetadata: Record<string, number> } {
    if (body.includes(Buffer.from('GPS', 'ascii')) || body.includes(Buffer.from([0x25, 0x88]))) {
      this.integrityFailure();
    }
    let width = 0;
    let height = 0;
    let mimeType: string;
    if (
      body.length >= 33 &&
      body.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) &&
      body.subarray(12, 16).toString('ascii') === 'IHDR' &&
      body.subarray(body.length - 8, body.length - 4).toString('ascii') === 'IEND'
    ) {
      mimeType = 'image/png';
      width = body.readUInt32BE(16);
      height = body.readUInt32BE(20);
    } else if (
      body.length >= 4 &&
      body[0] === 0xff &&
      body[1] === 0xd8 &&
      body[body.length - 2] === 0xff &&
      body[body.length - 1] === 0xd9
    ) {
      mimeType = 'image/jpeg';
      ({ width, height } = this.jpegDimensions(body));
    } else {
      return this.integrityFailure();
    }
    if (width < 1 || height < 1 || width * height > maximumPixels) this.integrityFailure();
    return { mimeType, durationSeconds: null, safeMetadata: { width, height } };
  }

  private jpegDimensions(body: Buffer): { width: number; height: number } {
    let offset = 2;
    while (offset + 9 < body.length) {
      if (body[offset] !== 0xff) return this.integrityFailure();
      const marker = body[offset + 1] ?? 0;
      offset += 2;
      if (marker === 0xd8 || marker === 0xd9) continue;
      const segmentLength = body.readUInt16BE(offset);
      if (segmentLength < 2 || offset + segmentLength > body.length) this.integrityFailure();
      if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb].includes(marker)) {
        return { height: body.readUInt16BE(offset + 3), width: body.readUInt16BE(offset + 5) };
      }
      offset += segmentLength;
    }
    return this.integrityFailure();
  }

  private parseVideo(
    body: Buffer,
    maximumDuration: number,
  ): { mimeType: string; durationSeconds: number; safeMetadata: Record<string, number> } {
    if (body.length < 32 || body.subarray(4, 8).toString('ascii') !== 'ftyp') {
      return this.integrityFailure();
    }
    const marker = body.indexOf(Buffer.from('mvhd', 'ascii'));
    if (marker < 4 || marker + 32 > body.length) return this.integrityFailure();
    const version = body[marker + 4];
    let timescale: number;
    let duration: number;
    if (version === 0) {
      timescale = body.readUInt32BE(marker + 16);
      duration = body.readUInt32BE(marker + 20);
    } else if (version === 1 && marker + 40 <= body.length) {
      timescale = body.readUInt32BE(marker + 24);
      const raw = body.readBigUInt64BE(marker + 28);
      if (raw > BigInt(Number.MAX_SAFE_INTEGER)) return this.integrityFailure();
      duration = Number(raw);
    } else {
      return this.integrityFailure();
    }
    if (timescale < 1 || duration < 1) return this.integrityFailure();
    const durationSeconds = Math.ceil(duration / timescale);
    if (durationSeconds < 1 || durationSeconds > maximumDuration) this.integrityFailure();
    const lowercase = body.toString('latin1').toLowerCase();
    if (lowercase.includes('©xyz') || lowercase.includes('location')) this.integrityFailure();
    return { mimeType: 'video/mp4', durationSeconds, safeMetadata: { durationSeconds } };
  }

  private integrityFailure(): never {
    throw new ApplicationError('MEDIA_INTEGRITY_MISMATCH', 422);
  }
}
