export interface RateLimitDecision {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

export abstract class RateLimitPort {
  abstract consume(key: string): RateLimitDecision;
}
