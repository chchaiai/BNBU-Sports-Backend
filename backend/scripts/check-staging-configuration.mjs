import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import process from 'node:process';

import { loadFileJsonSecret } from './file-json-secret.mjs';

const manifest = JSON.parse(
  await readFile(resolve('config/staging-configuration-requirements.json'), 'utf8'),
);
const checkFiles = process.argv.includes('--files');
const rows = [];

for (const item of manifest.nonSecret) {
  rows.push({
    name: item.name,
    status: configurationStatus(item, process.env[item.name]),
    owner: item.owner,
    source: item.source,
  });
}
for (const item of manifest.optionalNonSecret) {
  rows.push({
    name: item.name,
    status: configured(process.env[item.name]) ? 'CONFIGURED' : 'OPTIONAL',
    owner: item.owner,
    source: item.source,
  });
}
for (const item of manifest.consoleRequirements) {
  rows.push({
    name: item.name,
    status: 'UNKNOWN_CONSOLE_VERIFICATION',
    owner: 'USER_TENCENT_CONSOLE',
    source: item.source,
  });
}

if (checkFiles) {
  await inspectSecretFile(
    'RUNTIME_JSON_SECRET',
    process.env.BNBU_RUNTIME_SECRET_FILE,
    manifest.runtimeSecret,
  );
  await inspectSecretFile(
    'MIGRATOR_JSON_SECRET',
    process.env.BNBU_MIGRATOR_SECRET_FILE,
    manifest.migratorSecret,
  );
} else {
  for (const name of manifest.runtimeSecret) {
    rows.push({
      name,
      status: 'UNKNOWN_FILE_NOT_READ',
      owner: 'DOCKER_COMPOSE_SECRET',
      source: 'runtime JSON secret',
    });
  }
  for (const name of manifest.migratorSecret) {
    rows.push({
      name,
      status: 'UNKNOWN_FILE_NOT_READ',
      owner: 'DOCKER_COMPOSE_SECRET',
      source: 'migrator JSON secret',
    });
  }
}

for (const row of rows) {
  process.stdout.write(`${row.status}\t${row.name}\t${row.owner}\t${row.source}\n`);
}

const missing = rows.filter((row) => row.status === 'MISSING');
const mismatched = rows.filter((row) => row.status === 'MISMATCH');
const cloudFailures = rows.filter((row) => row.status === 'INVALID_OR_UNAVAILABLE');
process.stdout.write(
  `Staging configuration summary: configured=${rows.filter((row) => row.status === 'CONFIGURED').length} missing=${missing.length} mismatched=${mismatched.length} fileFailures=${cloudFailures.length} filesChecked=${checkFiles}\n`,
);
if (missing.length > 0 || mismatched.length > 0 || cloudFailures.length > 0) process.exitCode = 1;

async function inspectSecretFile(label, filePath, expectedKeys) {
  const environment = {};
  try {
    await loadFileJsonSecret({
      filePath,
      expectedKeys,
      environment,
    });
    for (const name of expectedKeys) {
      rows.push({ name, status: 'CONFIGURED', owner: 'DOCKER_COMPOSE_SECRET', source: label });
    }
  } catch (error) {
    rows.push({
      name: label,
      status: 'INVALID_OR_UNAVAILABLE',
      owner: 'USER_TENCENT_CONSOLE',
      source: error instanceof Error ? error.message : 'unknown validation failure',
    });
  }
}

function configured(value) {
  return typeof value === 'string' && value.trim().length > 0 && !value.includes('CHANGE_ME');
}

function configurationStatus(item, value) {
  if (!configured(value)) return 'MISSING';
  if (item.expected !== undefined && value.trim() !== String(item.expected)) return 'MISMATCH';
  return 'CONFIGURED';
}
