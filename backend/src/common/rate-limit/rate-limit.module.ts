import { Global, Module } from '@nestjs/common';

import { InMemoryRateLimitAdapter } from './in-memory-rate-limit.adapter.js';
import { RateLimitPort } from './rate-limit.port.js';
import { QrJoinPublicRateLimitService } from './qr-join-public-rate-limit.service.js';

@Global()
@Module({
  providers: [
    { provide: RateLimitPort, useClass: InMemoryRateLimitAdapter },
    QrJoinPublicRateLimitService,
  ],
  exports: [RateLimitPort, QrJoinPublicRateLimitService],
})
export class RateLimitModule {}
