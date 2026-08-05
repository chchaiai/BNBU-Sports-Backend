import { existsSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const layer = process.argv[2];
if (layer === undefined || !/^[a-z0-9-]+$/.test(layer)) {
  throw new Error('A safe test layer name is required');
}

const directory = resolve('test', layer);
if (!existsSync(directory)) throw new Error(`Test layer does not exist: ${layer}`);
const files = readdirSync(directory, { withFileTypes: true })
  .filter((entry) => entry.isFile() && entry.name.endsWith('.test.ts'))
  .map((entry) => resolve(directory, entry.name))
  .sort();
if (files.length === 0) throw new Error(`No tests were found for layer: ${layer}`);

const result = spawnSync(
  process.execPath,
  ['--import', 'tsx', '--test', '--test-concurrency=1', ...files],
  { stdio: 'inherit', env: process.env },
);
if (result.error !== undefined) throw result.error;
process.exitCode = result.status ?? 1;
