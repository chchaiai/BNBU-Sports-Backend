import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { describe, it } from 'node:test';
import { rootCertificates } from 'node:tls';

import YAML from 'yaml';

import { loadFileJsonSecret } from './file-json-secret.mjs';
import { createStrictPgClientConfig, prepareStrictMigrationEnvironment } from './postgres-tls.mjs';

const completeCaChain = `${rootCertificates[0]}\n${rootCertificates[1]}\n`;

describe('Tencent Cloud configuration tooling', () => {
  it('loads an exact key set from a mounted file without returning unrelated values', async () => {
    const environment = {};
    const result = await loadFileJsonSecret({
      filePath: '/run/secrets/bnbu_migrator.json',
      expectedKeys: ['MIGRATION_DATABASE_URL'],
      environment,
      readSecretFile: () =>
        Promise.resolve(
          Buffer.from(JSON.stringify({ MIGRATION_DATABASE_URL: 'synthetic-secret-value' })),
        ),
    });
    assert.deepEqual(result, { keys: ['MIGRATION_DATABASE_URL'] });
    assert.equal(environment.MIGRATION_DATABASE_URL, 'synthetic-secret-value');
  });

  it('reports missing names while redacting values and provider failures', async () => {
    await assert.rejects(
      loadFileJsonSecret({
        filePath: '/run/secrets/bnbu_runtime.json',
        expectedKeys: ['DATABASE_URL', 'SECURITY_HASH_KEY'],
        environment: {},
        readSecretFile: () =>
          Promise.resolve(Buffer.from(JSON.stringify({ DATABASE_URL: 'synthetic-secret-value' }))),
      }),
      (error) =>
        error instanceof Error &&
        error.message.includes('SECURITY_HASH_KEY') &&
        !error.message.includes('synthetic-secret-value'),
    );
    await assert.rejects(
      loadFileJsonSecret({
        filePath: '/run/secrets/bnbu_runtime.json',
        expectedKeys: ['DATABASE_URL'],
        environment: {},
        readSecretFile: () => Promise.reject(new Error('sensitive file-system detail')),
      }),
      (error) => error instanceof Error && error.message === 'JSON secret file could not be loaded',
    );
  });

  it('prints only configuration status and ownership in the preflight report', () => {
    const manifest = JSON.parse(
      readFileSync(resolve('config/staging-configuration-requirements.json'), 'utf8'),
    );
    const environment = { ...process.env };
    for (const item of manifest.nonSecret) {
      environment[item.name] = syntheticNonSecretValue(item);
    }
    environment.DATABASE_URL = 'sentinel-must-not-print';
    const result = spawnSync(
      process.execPath,
      [resolve('scripts/check-staging-configuration.mjs')],
      {
        cwd: process.cwd(),
        env: environment,
        encoding: 'utf8',
        windowsHide: true,
      },
    );
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /CONFIGURED\tAPP_ENV\tDEPLOYMENT/);
    assert.match(result.stdout, /UNKNOWN_FILE_NOT_READ\tDATABASE_URL\tDOCKER_COMPOSE_SECRET/);
    assert.match(
      result.stdout,
      /UNKNOWN_CONSOLE_VERIFICATION\tCVM_INSTANCE_ROLE_BINDING\tUSER_TENCENT_CONSOLE/,
    );
    assert.doesNotMatch(result.stdout, /sentinel-must-not-print/);

    environment.TENCENT_SES_TEMPLATE_ID = 'sentinel-wrong-template-id';
    const mismatch = spawnSync(
      process.execPath,
      [resolve('scripts/check-staging-configuration.mjs')],
      {
        cwd: process.cwd(),
        env: environment,
        encoding: 'utf8',
        windowsHide: true,
      },
    );
    assert.equal(mismatch.status, 1, mismatch.stderr);
    assert.match(mismatch.stdout, /MISMATCH\tTENCENT_SES_TEMPLATE_ID\tUSER_TENCENT_CONSOLE/);
    assert.doesNotMatch(mismatch.stdout, /sentinel-wrong-template-id/);

    environment.TENCENT_SES_TEMPLATE_ID = '56852';
    environment.CORS_ALLOWLIST = 'http://129.204.146.192';
    const insecureCors = spawnSync(
      process.execPath,
      [resolve('scripts/check-staging-configuration.mjs')],
      {
        cwd: process.cwd(),
        env: environment,
        encoding: 'utf8',
        windowsHide: true,
      },
    );
    assert.equal(insecureCors.status, 1, insecureCors.stderr);
    assert.match(insecureCors.stdout, /MISMATCH\tCORS_ALLOWLIST\tDEPLOYMENT/);

    environment.CORS_ALLOWLIST = 'https://web-origin-not-configured.invalid';
    const deferredCors = spawnSync(
      process.execPath,
      [resolve('scripts/check-staging-configuration.mjs')],
      {
        cwd: process.cwd(),
        env: environment,
        encoding: 'utf8',
        windowsHide: true,
      },
    );
    assert.equal(deferredCors.status, 0, deferredCors.stderr);
    assert.match(deferredCors.stdout, /DEFERRED\tCORS_ALLOWLIST\tDEPLOYMENT/);
  });

  it('checks host Compose secret sources without replacing container target paths', () => {
    const manifest = JSON.parse(
      readFileSync(resolve('config/staging-configuration-requirements.json'), 'utf8'),
    );
    const directory = mkdtempSync(join(tmpdir(), 'bnbu-staging-config-test-'));
    const runtimePath = join(directory, 'runtime.json');
    const migratorPath = join(directory, 'migrator.json');
    const fixturePath = join(directory, 'staging-fixture.json');
    const caPath = join(directory, 'tencentdb-ca-chain.pem');
    const runtimeSecret = Object.fromEntries(
      manifest.runtimeSecret.map((name) => [name, `synthetic-${name}`]),
    );
    const migratorSecret = Object.fromEntries(
      manifest.migratorSecret.map((name) => [name, `synthetic-${name}`]),
    );
    const fixtureSecret = Object.fromEntries(
      manifest.fixtureSecret.map((name) => [name, `synthetic-${name}`]),
    );
    writeFileSync(runtimePath, JSON.stringify(runtimeSecret), 'utf8');
    writeFileSync(migratorPath, JSON.stringify(migratorSecret), 'utf8');
    writeFileSync(fixturePath, JSON.stringify(fixtureSecret), 'utf8');
    writeFileSync(caPath, completeCaChain, 'utf8');

    try {
      const environment = { ...process.env };
      for (const item of manifest.nonSecret) {
        environment[item.name] = syntheticNonSecretValue(item);
      }
      environment.BNBU_RUNTIME_SECRET_FILE = runtimePath;
      environment.BNBU_MIGRATOR_SECRET_FILE = migratorPath;
      environment.BNBU_STAGING_FIXTURE_SECRET_FILE = fixturePath;
      environment.BNBU_TENCENTDB_CA_FILE = caPath;
      const result = spawnSync(
        process.execPath,
        [resolve('scripts/check-staging-configuration.mjs'), '--files'],
        {
          cwd: process.cwd(),
          env: environment,
          encoding: 'utf8',
          windowsHide: true,
        },
      );
      assert.equal(result.status, 0, result.stderr || result.stdout);
      assert.match(result.stdout, /CONFIGURED\tDATABASE_URL\tDOCKER_COMPOSE_SECRET/);
      assert.match(result.stdout, /CONFIGURED\tMIGRATION_DATABASE_URL\tDOCKER_COMPOSE_SECRET/);
      assert.match(result.stdout, /CONFIGURED\tSTAGING_ADMIN_PASSWORD\tDOCKER_COMPOSE_SECRET/);
      assert.match(result.stdout, /CONFIGURED\tTENCENTDB_CA_CHAIN\tDOCKER_COMPOSE_SECRET/);
      assert.doesNotMatch(result.stdout, /synthetic-DATABASE_URL/);
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it('grants all non-root containers only the dedicated secret reader group', () => {
    const compose = YAML.parse(readFileSync(resolve('docker-compose.staging.yml'), 'utf8'));

    assert.deepEqual(compose.services.backend.group_add, ['10001']);
    assert.deepEqual(compose.services.migrator.group_add, ['10001']);
    assert.deepEqual(compose.services['health-operator'].group_add, ['10001']);
    assert.deepEqual(compose.services.backend.secrets, [
      { source: 'bnbu_runtime', target: 'bnbu_runtime.json' },
      { source: 'tencentdb_ca', target: 'tencentdb-ca-chain.pem' },
    ]);
    assert.deepEqual(compose.services.migrator.secrets, [
      { source: 'bnbu_migrator', target: 'bnbu_migrator.json' },
      { source: 'tencentdb_ca', target: 'tencentdb-ca-chain.pem' },
    ]);
    assert.deepEqual(compose.services['health-operator'].secrets, [
      { source: 'bnbu_runtime', target: 'bnbu_runtime.json' },
      { source: 'bnbu_staging_fixture', target: 'bnbu_staging_fixture.json' },
      { source: 'tencentdb_ca', target: 'tencentdb-ca-chain.pem' },
    ]);
    assert.equal(
      compose.services.backend.secrets.some((item) => item.source.includes('fixture')),
      false,
    );
    assert.equal(
      compose.secrets.tencentdb_ca.file,
      '${BNBU_TENCENTDB_CA_FILE:?Set the host TencentDB CA chain file}',
    );
    assert.equal(
      compose.services['health-operator'].environment.STAGING_BOOTSTRAP_CONFIRMATION,
      '${STAGING_BOOTSTRAP_CONFIRMATION:-NOT_CONFIRMED}',
    );
    assert.equal(
      compose.secrets.bnbu_staging_fixture.file,
      '${BNBU_STAGING_FIXTURE_SECRET_FILE:-/nonexistent/bnbu-staging-fixture-not-configured.json}',
    );
  });

  it('prepares strict Prisma migration and pg client settings without retaining URL TLS downgrades', () => {
    const directory = mkdtempSync(join(tmpdir(), 'bnbu-tencentdb-ca-test-'));
    const caPath = join(directory, 'tencentdb-ca-chain.pem');
    writeFileSync(caPath, completeCaChain, 'utf8');
    try {
      const environment = {
        TENCENTDB_CA_FILE: caPath,
        MIGRATION_DATABASE_URL:
          'postgresql://migrator:synthetic@10.0.0.10:5432/sports?schema=public&sslmode=require',
      };
      prepareStrictMigrationEnvironment(environment);
      const strictUrl = new URL(environment.MIGRATION_DATABASE_URL);
      assert.equal(strictUrl.searchParams.get('sslmode'), 'verify-full');
      assert.equal(strictUrl.searchParams.get('sslaccept'), 'strict');
      assert.equal(environment.SSL_CERT_FILE, caPath);

      const certificate = {};
      let checkedHostname = null;
      let checkedCertificate = null;
      const client = createStrictPgClientConfig(environment.MIGRATION_DATABASE_URL, caPath, {
        checkServerIdentity: (hostname, peerCertificate) => {
          checkedHostname = hostname;
          checkedCertificate = peerCertificate;
          return undefined;
        },
      });
      assert.equal(client.host, '10.0.0.10');
      assert.equal(client.ssl.rejectUnauthorized, true);
      assert.equal(client.ssl.ca, completeCaChain);
      assert.equal(client.connectionString, undefined);
      assert.equal('servername' in client.ssl, false);
      assert.equal(typeof client.ssl.checkServerIdentity, 'function');
      assert.equal(client.ssl.checkServerIdentity('localhost', certificate), undefined);
      assert.equal(checkedHostname, '10.0.0.10');
      assert.equal(checkedCertificate, certificate);
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it('pins COS permissions to the staging bucket and two application prefixes', () => {
    const policy = JSON.parse(
      readFileSync(resolve('config/tencent-cloud-staging-cam-policy.json'), 'utf8'),
    );
    const statements = policy.statement;
    const actions = statements.flatMap((statement) => statement.action);
    const resources = statements.flatMap((statement) => statement.resource);
    assert.equal(policy.version, '2.0');
    assert.equal(actions.includes('*'), false);
    assert.equal(
      actions.some((action) => action.includes('FullControl')),
      false,
    );
    assert.equal(actions.includes('name/cos:DeleteBucket'), false);
    assert.equal(actions.includes('name/cos:HeadBucket'), true);
    assert.equal(actions.includes('name/cos:PutObject'), true);
    assert.equal(actions.includes('name/cos:GetObject'), true);
    assert.equal(actions.includes('name/cos:DeleteObject'), true);
    assert.equal(
      resources.every(
        (resource) =>
          resource.startsWith(
            'qcs::cos:ap-guangzhou:uid/1443273655:sports-staging-media-1443273655/',
          ) && !resource.includes('*:*'),
      ),
      true,
    );
    assert.equal(
      resources.some((resource) => resource.endsWith('/roster-sources/*')),
      true,
    );
    assert.equal(
      resources.some((resource) => resource.endsWith('/media/*')),
      true,
    );
  });

  it('pins SES permissions to SendEmail only', () => {
    const policy = JSON.parse(
      readFileSync(resolve('config/tencent-cloud-staging-ses-cam-policy.json'), 'utf8'),
    );
    assert.deepEqual(policy, {
      version: '2.0',
      statement: [
        {
          effect: 'allow',
          action: ['name/ses:SendEmail'],
          resource: ['*'],
        },
      ],
    });
  });
});

function syntheticNonSecretValue(item) {
  if (item.expected !== undefined) return String(item.expected);
  if (item.validation === 'HTTPS_ORIGIN_LIST') return 'https://staging-web.example.test';
  return 'synthetic-configured';
}
