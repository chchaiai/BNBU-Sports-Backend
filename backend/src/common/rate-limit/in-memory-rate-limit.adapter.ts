import { Inject, Injectable } from '@nestjs/common';

import type { RuntimeConfig } from '../config/environment.js';
import { RUNTIME_CONFIG } from '../config/runtime-config.module.js';
import { Clock } from '../time/clock.js';
import { RateLimitPort, type RateLimitDecision } from './rate-limit.port.js';

interface WindowState {
  count: number;
  resetAtMs: number;
}

@Injectable()
export class InMemoryRateLimitAdapter extends RateLimitPort {
  private readonly windows = new Map<string, WindowState>();

  constructor(
    private readonly clock: Clock,
    @Inject(RUNTIME_CONFIG) private readonly config: RuntimeConfig,
  ) {
    super();
  }

  consume(key: string): RateLimitDecision {
    const nowMs = this.clock.now().getTime();
    const durationMs = this.config.authRateLimitWindowSeconds * 1_000;
    const current = this.windows.get(key);
    const state =
      current === undefined || current.resetAtMs <= nowMs
        ? { count: 0, resetAtMs: nowMs + durationMs }
        : current;
    state.count += 1;
    this.windows.set(key, state);

    const allowed = state.count <= this.config.authRateLimitMaxAttempts;
    return {
      allowed,
      remaining: Math.max(0, this.config.authRateLimitMaxAttempts - state.count),
      retryAfterSeconds: allowed ? 0 : Math.max(1, Math.ceil((state.resetAtMs - nowMs) / 1_000)),
    };
  }
}
