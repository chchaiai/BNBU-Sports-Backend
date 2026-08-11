import { readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';

const reportArgument = process.argv.find((value) => value.startsWith('--report='));
const reportPath = reportArgument
  ? resolve(reportArgument.slice('--report='.length))
  : resolve(tmpdir(), 'bnbu-runtime-conformance-e2e.ndjson');
const write = process.argv.includes('--write');

const openapi = JSON.parse(
  readFileSync(resolve('src/generated/openapi.document.generated.json'), 'utf8'),
);
const runtime = JSON.parse(readFileSync(resolve('runtime-coverage.manifest.json'), 'utf8'));
const events = readFileSync(reportPath, 'utf8')
  .split(/\r?\n/u)
  .filter(Boolean)
  .map((line) => JSON.parse(line));
const defaultDeny = new Set(runtime.implementedDefaultDeny);
const methods = new Set(['get', 'post', 'put', 'patch', 'delete']);
const operations = Object.entries(openapi.paths).flatMap(([path, pathItem]) =>
  Object.entries(pathItem)
    .filter(([method]) => methods.has(method))
    .map(([method, operation]) => ({
      operationId: operation.operationId,
      method: method.toUpperCase(),
      path,
      disabled: defaultDeny.has(operation.operationId),
    })),
);

const failures = [];
const coverage = operations.map((operation) => {
  const observed = events.filter(
    (event) => event.operationId === operation.operationId && event.phase === 'response',
  );
  const invalid = observed.filter((event) => event.valid !== true);
  const statuses = [...new Set(observed.map((event) => event.status))].sort(
    (left, right) => left - right,
  );
  const successStatuses = statuses.filter((status) => status >= 200 && status < 300);
  const errorStatuses = statuses.filter((status) => status >= 400);
  if (invalid.length > 0)
    failures.push(`${operation.operationId}: ${invalid.length} invalid response(s)`);
  if (operation.disabled) {
    if (errorStatuses.length === 0) {
      failures.push(
        `${operation.operationId}: intentionally disabled path lacks fail-closed response`,
      );
    }
    if (successStatuses.length > 0) {
      failures.push(`${operation.operationId}: intentionally disabled path returned success`);
    }
  } else {
    if (successStatuses.length === 0) {
      failures.push(`${operation.operationId}: enabled public path lacks successful response`);
    }
    if (errorStatuses.length === 0) {
      failures.push(`${operation.operationId}: lacks error or access-control response`);
    }
  }
  return {
    ...operation,
    completionStatus: operation.disabled ? 'INTENTIONALLY_DISABLED' : 'IMPLEMENTED_AND_CONFORMANT',
    conformanceStatus: operation.disabled
      ? 'INTENTIONALLY_DISABLED_VALIDATED'
      : successStatuses.length > 0 && errorStatuses.length > 0
        ? 'BOTH_VALIDATED'
        : successStatuses.length > 0
          ? 'SUCCESS_RESPONSE_VALIDATED'
          : 'ERROR_RESPONSE_VALIDATED',
    successStatuses,
    errorStatuses,
  };
});

if (operations.length !== runtime.expectedOperationCount) {
  failures.push(
    `operation count ${operations.length} does not match expected ${runtime.expectedOperationCount}`,
  );
}
if (Object.keys(runtime.implemented).length !== operations.length) {
  failures.push(
    `runtime manifest count ${Object.keys(runtime.implemented).length} does not match OpenAPI ${operations.length}`,
  );
}
if (defaultDeny.size !== 17)
  failures.push(`intentionally disabled count is ${defaultDeny.size}, expected 17`);

const summary = {
  operationCount: coverage.length,
  enabledCount: coverage.filter((entry) => !entry.disabled).length,
  intentionallyDisabledCount: coverage.filter((entry) => entry.disabled).length,
  successCoveredCount: coverage.filter((entry) => entry.successStatuses.length > 0).length,
  errorCoveredCount: coverage.filter((entry) => entry.errorStatuses.length > 0).length,
  conformantEventCount: events.filter((event) => event.phase === 'response' && event.valid === true)
    .length,
  invalidEventCount: events.filter((event) => event.phase === 'response' && event.valid !== true)
    .length,
};

if (write) {
  const registry = { contractVersion: openapi.info.version, summary, operations: coverage };
  writeFileSync(
    resolve('../docs/backend-contracts/runtime-conformance-report.json'),
    `${JSON.stringify(registry, null, 2)}\n`,
  );
  const rows = coverage.map(
    (entry) =>
      `| ${entry.operationId} | ${entry.method} | \`${entry.path}\` | ${entry.completionStatus} | ${entry.conformanceStatus} | ${entry.successStatuses.join(', ') || '-'} | ${entry.errorStatuses.join(', ') || '-'} |`,
  );
  const markdown = `# Operation Completion Matrix

Generated from the canonical OpenAPI document, the runtime coverage manifest, and the strict real-HTTP E2E conformance report. Do not edit by hand.

## Summary

| Metric | Count |
| --- | ---: |
| Contract operations | ${summary.operationCount} |
| Implemented and conformant | ${summary.enabledCount} |
| Intentionally disabled and fail-closed | ${summary.intentionallyDisabledCount} |
| Not implemented | 0 |
| Enabled success coverage | ${summary.successCoveredCount}/${summary.enabledCount} |
| Error/access coverage | ${summary.errorCoveredCount}/${summary.operationCount} |

## Operations

| Operation | Method | Path | Completion | Runtime conformance | Success status | Error/access status |
| --- | --- | --- | --- | --- | --- | --- |
${rows.join('\n')}
`;
  writeFileSync(resolve('../docs/backend-contracts/OPERATION-COMPLETION-MATRIX.md'), markdown);
}

if (failures.length > 0) {
  console.error(`Runtime conformance coverage failed (${failures.length}):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log(
    `Runtime conformance coverage passed: ${summary.enabledCount}/${summary.enabledCount} enabled successes, ${summary.errorCoveredCount}/${summary.operationCount} error/access responses, ${summary.intentionallyDisabledCount} fail-closed.`,
  );
}
