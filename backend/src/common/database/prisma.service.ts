import { Inject, Injectable, type OnModuleDestroy } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';

import type { RuntimeConfig } from '../config/environment.js';
import { RUNTIME_CONFIG } from '../config/runtime-config.module.js';
import { PrismaClient } from '../../generated/prisma/client.js';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  constructor(@Inject(RUNTIME_CONFIG) config: RuntimeConfig) {
    super({
      adapter: new PrismaPg({
        connectionString: config.databaseUrl,
        connectionTimeoutMillis: Math.min(config.requestTimeoutMs, 5_000),
        max: 10,
      }),
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
