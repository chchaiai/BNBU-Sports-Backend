import { createHash } from 'node:crypto';
import type { Readable } from 'node:stream';

import { Injectable } from '@nestjs/common';

import type { MediaConfig } from '../../../common/config/environment.js';
import { ApplicationError } from '../../../common/errors/application-error.js';

export interface DeclaredMediaFacts {
  businessPurpose: string;
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
const EICAR = Buffer.from('EICAR-STANDARD-ANTIVIRUS-TEST-FILE', 'ascii');
const MAX_VIDEO_METADATA_BYTES = 8 * 1024 * 1024;

export const MAX_EXERCISE_VIDEO_DURATION_SECONDS = 15;
const MAX_NON_EXERCISE_VIDEO_DURATION_SECONDS = 300;

@Injectable()
export class MediaValidator {
  validateDeclaration(facts: DeclaredMediaFacts, config: MediaConfig): void {
    const mimeType = facts.mimeType.toLowerCase();
    if (
      (facts.mediaType === 'IMAGE' && !IMAGE_MIME.has(mimeType)) ||
      (facts.mediaType === 'VIDEO' && !mimeType.startsWith('video/'))
    ) {
      throw new ApplicationError('MEDIA_TYPE_NOT_ALLOWED', 415);
    }
    if (!Number.isSafeInteger(facts.fileSizeBytes) || facts.fileSizeBytes < 1) {
      throw new ApplicationError('VALIDATION_FAILED', 422);
    }
    if (facts.mediaType === 'IMAGE' && facts.fileSizeBytes > config.maxImageBytes) {
      throw new ApplicationError('MEDIA_SIZE_EXCEEDED', 413);
    }
    if (facts.mediaType === 'IMAGE' && facts.durationSeconds !== null) {
      throw new ApplicationError('VALIDATION_FAILED', 422);
    }
    if (facts.mediaType === 'VIDEO') {
      if (facts.durationSeconds === null || facts.durationSeconds < 1) {
        throw new ApplicationError('VALIDATION_FAILED', 422);
      }
      this.enforceVideoDuration(facts.businessPurpose, facts.durationSeconds, 1);
    }
  }

  async readAndVerify(
    stream: Readable,
    declared: DeclaredMediaFacts,
    config: MediaConfig,
  ): Promise<VerifiedMediaFacts> {
    if (declared.mediaType === 'VIDEO') {
      return this.readAndVerifyVideo(stream, declared, config);
    }
    const maximum = config.maxImageBytes;
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

    const parsed = this.parseImage(body, config.maxImagePixels);
    if (parsed.mimeType !== declared.mimeType.toLowerCase()) this.integrityFailure();
    return {
      mimeType: parsed.mimeType,
      fileSizeBytes: length,
      contentSha256: digest,
      durationSeconds: parsed.durationSeconds,
      safeMetadata: parsed.safeMetadata,
    };
  }

  private async readAndVerifyVideo(
    stream: Readable,
    declared: DeclaredMediaFacts,
    config: MediaConfig,
  ): Promise<VerifiedMediaFacts> {
    const digest = createHash('sha256');
    let length = 0;
    let prefix = Buffer.alloc(0);
    let scanTail = Buffer.alloc(0);
    const containerProbe = new IsoBaseMediaProbe();
    let unsafeContent = false;
    for await (const chunk of stream) {
      const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as Uint8Array);
      length += buffer.length;
      digest.update(buffer);
      if (prefix.length < 32) {
        prefix = Buffer.concat([prefix, buffer.subarray(0, 32 - prefix.length)]);
      }
      const scan = Buffer.concat([scanTail, buffer]);
      const lowercase = scan.toString('latin1').toLowerCase();
      unsafeContent ||= scan.includes(EICAR) || lowercase.includes('location');
      containerProbe.push(buffer);
      scanTail = Buffer.from(scan.subarray(Math.max(0, scan.length - 64)));
    }
    if (length !== declared.fileSizeBytes || length < 32 || unsafeContent) this.integrityFailure();
    const contentSha256 = digest.digest('hex');
    if (declared.contentSha256 !== null && declared.contentSha256 !== contentSha256) {
      this.integrityFailure();
    }
    if (config.scannerMode === 'EXTERNAL_REQUIRED') {
      throw new ApplicationError('SYSTEM_SERVICE_UNAVAILABLE', 503, {
        dependency: 'MEDIA_SCANNER',
      });
    }
    if (prefix.subarray(4, 8).toString('ascii') !== 'ftyp') {
      return this.integrityFailure();
    }
    const { movieHeader, hasAudioTrack } = containerProbe.finish();
    const mimeType = this.isoBaseMediaMimeType(prefix.subarray(8, 12).toString('ascii'));
    if (mimeType !== declared.mimeType.toLowerCase()) this.integrityFailure();
    const timing = this.parseMovieHeader(movieHeader);
    this.enforceVideoDuration(declared.businessPurpose, timing.duration, timing.timescale);
    if (declared.businessPurpose === 'EXERCISE_RECORD' && !hasAudioTrack) {
      throw new ApplicationError('MEDIA_AUDIO_TRACK_REQUIRED', 422);
    }
    const durationSeconds = Math.ceil(timing.duration / timing.timescale);
    if (declared.durationSeconds === null || durationSeconds !== declared.durationSeconds) {
      this.integrityFailure();
    }
    return {
      mimeType,
      fileSizeBytes: length,
      contentSha256,
      durationSeconds,
      safeMetadata: { durationSeconds, audioTrackCount: hasAudioTrack ? 1 : 0 },
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

  private parseMovieHeader(header: Buffer): { timescale: number; duration: number } {
    const version = header[4];
    let timescale: number;
    let duration: number;
    if (version === 0) {
      timescale = header.readUInt32BE(16);
      duration = header.readUInt32BE(20);
    } else if (version === 1) {
      timescale = header.readUInt32BE(24);
      const raw = header.readBigUInt64BE(28);
      if (raw > BigInt(Number.MAX_SAFE_INTEGER)) return this.integrityFailure();
      duration = Number(raw);
    } else {
      return this.integrityFailure();
    }
    if (timescale < 1 || duration < 1) return this.integrityFailure();
    return { timescale, duration };
  }

  private isoBaseMediaMimeType(brand: string): string {
    if (brand === 'qt  ') return 'video/quicktime';
    if (brand.toLowerCase().startsWith('3g')) return 'video/3gpp';
    return 'video/mp4';
  }

  private enforceVideoDuration(businessPurpose: string, duration: number, timescale: number): void {
    const maximum =
      businessPurpose === 'EXERCISE_RECORD'
        ? MAX_EXERCISE_VIDEO_DURATION_SECONDS
        : MAX_NON_EXERCISE_VIDEO_DURATION_SECONDS;
    if (duration > maximum * timescale) {
      throw new ApplicationError('MEDIA_VIDEO_DURATION_EXCEEDED', 422);
    }
  }

  private integrityFailure(): never {
    throw new ApplicationError('MEDIA_INTEGRITY_MISMATCH', 422);
  }
}

interface IsoBox {
  type: string;
  start: number;
  headerSize: number;
  end: number;
}

class IsoBaseMediaProbe {
  private pending = Buffer.alloc(0);
  private remainingSkipBytes = 0;
  private skipToEndOfFile = false;
  private movieBox: Buffer | null = null;

  push(chunk: Buffer): void {
    if (this.skipToEndOfFile) return;
    const input = this.pending.length === 0 ? chunk : Buffer.concat([this.pending, chunk]);
    this.pending = Buffer.alloc(0);
    let offset = 0;
    while (offset < input.length) {
      if (this.remainingSkipBytes > 0) {
        const consumed = Math.min(this.remainingSkipBytes, input.length - offset);
        offset += consumed;
        this.remainingSkipBytes -= consumed;
        continue;
      }
      const parsed = this.readBox(input, offset, input.length, true);
      if (parsed === null) {
        this.pending = Buffer.from(input.subarray(offset));
        if (this.pending.length > MAX_VIDEO_METADATA_BYTES) this.invalid();
        return;
      }
      if (parsed.type === 'EOF_MDAT') {
        this.skipToEndOfFile = true;
        return;
      }
      const boxSize = parsed.end - parsed.start;
      const available = input.length - offset;
      if (parsed.type === 'moov') {
        if (boxSize > MAX_VIDEO_METADATA_BYTES) this.invalid();
        if (available < boxSize) {
          this.pending = Buffer.from(input.subarray(offset));
          return;
        }
        if (this.movieBox !== null) this.invalid();
        this.movieBox = Buffer.from(input.subarray(offset, offset + boxSize));
        offset += boxSize;
        continue;
      }
      const consumed = Math.min(available, boxSize);
      offset += consumed;
      this.remainingSkipBytes = boxSize - consumed;
    }
  }

  finish(): { movieHeader: Buffer; hasAudioTrack: boolean } {
    if (
      this.movieBox === null ||
      this.remainingSkipBytes !== 0 ||
      (!this.skipToEndOfFile && this.pending.length !== 0)
    ) {
      return this.invalid();
    }
    const root = this.readBoxes(this.movieBox, 0, this.movieBox.length);
    if (root.length !== 1 || root[0]?.type !== 'moov') return this.invalid();
    const movie = root[0];
    const children = this.readBoxes(this.movieBox, movie.start + movie.headerSize, movie.end);
    const movieHeaderBox = children.find((box) => box.type === 'mvhd');
    if (movieHeaderBox === undefined || movieHeaderBox.end - movieHeaderBox.start < 44) {
      return this.invalid();
    }
    const movieHeader = Buffer.from(
      this.movieBox.subarray(movieHeaderBox.start + 4, movieHeaderBox.start + 44),
    );
    const hasAudioTrack = children
      .filter((box) => box.type === 'trak')
      .some((track) => this.trackHasAudioHandler(this.movieBox!, track));
    return { movieHeader, hasAudioTrack };
  }

  private trackHasAudioHandler(buffer: Buffer, track: IsoBox): boolean {
    const trackChildren = this.readBoxes(buffer, track.start + track.headerSize, track.end);
    for (const media of trackChildren.filter((box) => box.type === 'mdia')) {
      const mediaChildren = this.readBoxes(buffer, media.start + media.headerSize, media.end);
      for (const handler of mediaChildren.filter((box) => box.type === 'hdlr')) {
        const handlerTypeStart = handler.start + handler.headerSize + 8;
        if (
          handlerTypeStart + 4 <= handler.end &&
          buffer.subarray(handlerTypeStart, handlerTypeStart + 4).toString('ascii') === 'soun'
        ) {
          return true;
        }
      }
    }
    return false;
  }

  private readBoxes(buffer: Buffer, start: number, end: number): IsoBox[] {
    const boxes: IsoBox[] = [];
    let offset = start;
    while (offset < end) {
      const box = this.readBox(buffer, offset, end, false);
      if (box === null || box.type === 'EOF_MDAT') return this.invalid();
      boxes.push(box);
      offset = box.end;
    }
    return boxes;
  }

  private readBox(
    buffer: Buffer,
    start: number,
    end: number,
    allowIncomplete: boolean,
  ): IsoBox | null {
    if (end - start < 8) return allowIncomplete ? null : this.invalid();
    const size32 = buffer.readUInt32BE(start);
    const type = buffer.subarray(start + 4, start + 8).toString('ascii');
    let headerSize = 8;
    let boxSize: number;
    if (size32 === 1) {
      if (end - start < 16) return allowIncomplete ? null : this.invalid();
      const size64 = buffer.readBigUInt64BE(start + 8);
      if (size64 > BigInt(Number.MAX_SAFE_INTEGER)) return this.invalid();
      headerSize = 16;
      boxSize = Number(size64);
    } else if (size32 === 0) {
      if (allowIncomplete && type === 'mdat') {
        return { type: 'EOF_MDAT', start, headerSize, end };
      }
      boxSize = end - start;
    } else {
      boxSize = size32;
    }
    if (boxSize < headerSize) return this.invalid();
    if (!allowIncomplete && start + boxSize > end) return this.invalid();
    return { type, start, headerSize, end: start + boxSize };
  }

  private invalid(): never {
    throw new ApplicationError('MEDIA_INTEGRITY_MISMATCH', 422);
  }
}
