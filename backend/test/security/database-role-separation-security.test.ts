import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, it } from 'node:test';

const backendRoot = resolve(import.meta.dirname, '../..');
const repositoryRoot = resolve(backendRoot, '..');

async function source(relativePath: string): Promise<string> {
  return readFile(resolve(repositoryRoot, relativePath), 'utf8');
}

describe('Docker database role separation', () => {
  it('uses a bootstrap identity distinct from the migration and runtime identities', async () => {
    const compose = await source('backend/docker-compose.yml');
    const bootstrap = await source('backend/docker/postgres/init-local.sh');

    assert.match(compose, /POSTGRES_USER: \$\{POSTGRES_BOOTSTRAP_USER:/);
    assert.match(compose, /POSTGRES_MIGRATOR_USER: \$\{POSTGRES_MIGRATOR_USER:/);
    assert.doesNotMatch(compose, /POSTGRES_USER: \$\{POSTGRES_MIGRATOR_USER:/);
    assert.match(bootstrap, /LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT PASSWORD/);
    assert.match(bootstrap, /REVOKE CONNECT, CREATE, TEMPORARY ON DATABASE/);
    assert.match(bootstrap, /REVOKE CREATE ON SCHEMA public FROM PUBLIC/);
    assert.match(bootstrap, /GRANT CONNECT, CREATE ON DATABASE %I TO %I/);
    assert.match(bootstrap, /GRANT CONNECT ON DATABASE %I TO %I/);
  });

  it('makes migration history read-only to the runtime identity after every deploy', async () => {
    const dockerfile = await source('backend/Dockerfile');
    const packageJson = await source('backend/package.json');
    const hardening = await source('backend/scripts/harden-runtime-database-access.mjs');

    assert.match(dockerfile, /db:migrate:deploy:container/);
    assert.match(packageJson, /db:migrate:deploy:container/);
    assert.match(hardening, /REVOKE ALL PRIVILEGES ON TABLE public\."_prisma_migrations"/);
    assert.match(hardening, /GRANT SELECT ON TABLE public\."_prisma_migrations"/);
    assert.match(hardening, /has_table_privilege/);
  });
});
