import { Inject, Injectable } from '@nestjs/common';

import type { RuntimeConfig } from '../config/environment.js';
import { RUNTIME_CONFIG } from '../config/runtime-config.module.js';
import { ApplicationError } from '../errors/application-error.js';
import { Clock } from '../time/clock.js';

interface WindowState {
  count: number;
  resetAtMs: number;
}

@Injectable()
export class QrJoinPublicRateLimitService {
  private readonly windows = new Map<string, WindowState>();

  constructor(
    private readonly clock: Clock,
    @Inject(RUNTIME_CONFIG) private readonly config: RuntimeConfig,
  ) {}

  enforce(keys: readonly string[]): void {
    const nowMs = this.clock.now().getTime();
    const durationMs = this.config.qrJoinPublicRateLimitWindowSeconds * 1_000;
    let retryAfterSeconds = 0;
    for (const key of keys) {
      const current = this.windows.get(key);
      const state =
        current === undefined || current.resetAtMs <= nowMs
          ? { count: 0, resetAtMs: nowMs + durationMs }
          : current;
      state.count += 1;
      this.windows.set(key, state);
      if (state.count > this.config.qrJoinPublicRateLimitMaxRequests) {
        retryAfterSeconds = Math.max(
          retryAfterSeconds,
          Math.max(1, Math.ceil((state.resetAtMs - nowMs) / 1_000)),
        );
      }
    }
    if (retryAfterSeconds > 0) {
      throw new ApplicationError('AUTH_RATE_LIMITED', 429, { retryAfterSeconds });
    }
  }
}
