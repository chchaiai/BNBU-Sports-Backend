import { Injectable } from '@nestjs/common';

import { foundationMigrations } from '../../generated/migration-manifest.generated.js';
import { PrismaService } from './prisma.service.js';

interface MigrationRecord {
  migration_name: string;
  checksum: string;
  finished_at: Date | null;
  rolled_back_at: Date | null;
}

export interface MigrationCompatibility {
  compatible: boolean;
  reason: 'READY' | 'MISSING' | 'CHECKSUM_MISMATCH' | 'INCOMPLETE' | 'DATABASE_UNAVAILABLE';
}

@Injectable()
export class MigrationCompatibilityService {
  constructor(private readonly prisma: PrismaService) {}

  async check(): Promise<MigrationCompatibility> {
    try {
      for (const migration of foundationMigrations) {
        const rows = await this.prisma.$queryRaw<MigrationRecord[]>`
          SELECT migration_name, checksum, finished_at, rolled_back_at
          FROM "_prisma_migrations"
          WHERE migration_name = ${migration.migrationId}
          LIMIT 1
        `;
        const row = rows[0];
        if (row === undefined) return { compatible: false, reason: 'MISSING' };
        if (row.checksum !== migration.sha256) {
          return { compatible: false, reason: 'CHECKSUM_MISMATCH' };
        }
        if (row.finished_at === null || row.rolled_back_at !== null) {
          return { compatible: false, reason: 'INCOMPLETE' };
        }
      }
      return { compatible: true, reason: 'READY' };
    } catch {
      return { compatible: false, reason: 'DATABASE_UNAVAILABLE' };
    }
  }
}
