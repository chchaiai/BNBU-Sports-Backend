import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
);
const failures = [];

const paths = {
  canonical: "docs/backend-contracts/openapi.yaml",
  currentContract: "docs/backend-contracts/current-contract.json",
  releaseManifest:
    "docs/backend-contracts/releases/1.5.0-contract/release-manifest.json",
  clientBaseline: "docs/client-handoff/client-contract-baseline.json",
  androidSnapshot:
    "BNBU-Sports-Android-master/app/openapi/openapi.snapshot.yaml",
  androidMetadata: "BNBU-Sports-Android-master/app/openapi/contract.properties",
  webSnapshot:
    "BNBU-Sports-Web-new/portal-teacher-admin/openapi/openapi.snapshot.yaml",
  webMetadata: "BNBU-Sports-Web-new/portal-teacher-admin/openapi/contract.json",
  webGeneratedTypes:
    "BNBU-Sports-Web-new/portal-teacher-admin/app/openapi.generated.ts",
};

function absolute(path) {
  return resolve(repositoryRoot, path);
}

function readBytes(path) {
  const target = absolute(path);
  if (!existsSync(target)) {
    failures.push(`missing required file: ${path}`);
    return Buffer.alloc(0);
  }
  return readFileSync(target);
}

function readJson(path) {
  const bytes = readBytes(path);
  if (bytes.length === 0) return {};
  try {
    return JSON.parse(bytes.toString("utf8"));
  } catch (error) {
    failures.push(`invalid JSON in ${path}: ${error.message}`);
    return {};
  }
}

function readProperties(path) {
  const properties = {};
  for (const line of readBytes(path).toString("utf8").split(/\r?\n/u)) {
    const trimmed = line.trim();
    if (trimmed.length === 0 || trimmed.startsWith("#")) continue;
    const separator = trimmed.indexOf("=");
    if (separator <= 0) {
      failures.push(`invalid property line in ${path}: ${line}`);
      continue;
    }
    properties[trimmed.slice(0, separator).trim()] = trimmed
      .slice(separator + 1)
      .trim();
  }
  return properties;
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function expect(condition, message) {
  if (!condition) failures.push(message);
}

function expectEqual(actual, expected, label) {
  expect(
    actual === expected,
    `${label}: expected ${JSON.stringify(expected)}, found ${JSON.stringify(actual)}`,
  );
}

const clientRoots = ["BNBU-Sports-Android-master", "BNBU-Sports-Web-new"];
const presentClientRoots = clientRoots.filter((path) =>
  existsSync(absolute(path)),
);
const isBackendPublicationMirror = presentClientRoots.length === 0;
expect(
  isBackendPublicationMirror ||
    presentClientRoots.length === clientRoots.length,
  `partial client checkout is not supported: found ${presentClientRoots.length}/${clientRoots.length}`,
);

const canonicalBytes = readBytes(paths.canonical);
const canonicalText = canonicalBytes.toString("utf8");
const canonicalSha256 = sha256(canonicalBytes);
const versionMatch = canonicalText.match(/^  version:\s*(\S+)\s*$/mu);
const canonicalVersion = versionMatch?.[1] ?? null;
const canonicalOperationCount = (
  canonicalText.match(/^\s+operationId:\s+\S+\s*$/gmu) ?? []
).length;

expect(canonicalBytes.length > 0, "canonical OpenAPI is empty");
expect(
  !canonicalBytes.includes(13),
  "canonical OpenAPI must use LF line endings",
);
expect(
  canonicalText.includes("  - url: /api/v1"),
  "canonical OpenAPI must declare /api/v1",
);

const currentContract = readJson(paths.currentContract);
const releaseManifest = readJson(paths.releaseManifest);
const clientBaseline = readJson(paths.clientBaseline);
const androidMetadata = isBackendPublicationMirror
  ? {}
  : readProperties(paths.androidMetadata);
const webMetadata = isBackendPublicationMirror
  ? {}
  : readJson(paths.webMetadata);

const expectedVersion = currentContract.currentCandidate;
const expectedSha256 = currentContract.sha256;
const expectedOperationCount = releaseManifest.counts?.operations;
const expectedSchemaCount = releaseManifest.counts?.schemas;
const expectedSourceCommit = clientBaseline.contract?.sourceCommit;

expectEqual(canonicalVersion, expectedVersion, "canonical version");
expectEqual(canonicalSha256, expectedSha256, "canonical SHA-256");
expectEqual(
  canonicalOperationCount,
  expectedOperationCount,
  "canonical operation count",
);
expectEqual(
  releaseManifest.contractVersion,
  expectedVersion,
  "release manifest version",
);
expectEqual(releaseManifest.sha256, expectedSha256, "release manifest SHA-256");
expectEqual(
  clientBaseline.status,
  "CONTRACT_BASELINE_BOUND_LOCAL",
  "client baseline status",
);
expectEqual(
  clientBaseline.contract?.canonicalPath,
  paths.canonical,
  "client baseline canonical path",
);
expectEqual(
  clientBaseline.contract?.version,
  expectedVersion,
  "client baseline version",
);
expectEqual(
  clientBaseline.contract?.sha256,
  expectedSha256,
  "client baseline SHA-256",
);
expectEqual(
  clientBaseline.contract?.operationCount,
  expectedOperationCount,
  "client baseline operation count",
);
expectEqual(
  clientBaseline.contract?.schemaCount,
  expectedSchemaCount,
  "client baseline schema count",
);
expectEqual(
  clientBaseline.gates?.clientContractBaseline,
  true,
  "client contract baseline gate",
);
expectEqual(
  clientBaseline.gates?.stagingRuntimeReadiness,
  false,
  "staging runtime readiness gate",
);
expectEqual(
  clientBaseline.gates?.clientIntegrationStarted,
  false,
  "client integration started gate",
);

if (!isBackendPublicationMirror) {
  for (const [name, snapshotPath] of [
    ["Android", paths.androidSnapshot],
    ["Web", paths.webSnapshot],
  ]) {
    const snapshotBytes = readBytes(snapshotPath);
    expect(
      snapshotBytes.equals(canonicalBytes),
      `${name} OpenAPI snapshot is not byte-identical to ${paths.canonical}`,
    );
  }

  expectEqual(
    androidMetadata.sourcePath,
    paths.canonical,
    "Android source path",
  );
  expectEqual(
    androidMetadata.sourceCommit,
    expectedSourceCommit,
    "Android source commit",
  );
  expectEqual(
    androidMetadata.contractVersion,
    expectedVersion,
    "Android contract version",
  );
  expectEqual(
    androidMetadata.sha256,
    expectedSha256,
    "Android contract SHA-256",
  );
  expectEqual(
    Number(androidMetadata.operationCount),
    expectedOperationCount,
    "Android operation count",
  );

  expectEqual(webMetadata.sourcePath, paths.canonical, "Web source path");
  expectEqual(
    webMetadata.sourceCommit,
    expectedSourceCommit,
    "Web source commit",
  );
  expectEqual(
    webMetadata.contractVersion,
    expectedVersion,
    "Web contract version",
  );
  expectEqual(webMetadata.sha256, expectedSha256, "Web contract SHA-256");
  expectEqual(
    webMetadata.operationCount,
    expectedOperationCount,
    "Web operation count",
  );
  expectEqual(webMetadata.schemaCount, expectedSchemaCount, "Web schema count");
  expectEqual(
    webMetadata.generatedTypesPath,
    "app/openapi.generated.ts",
    "Web generated types path",
  );
  expectEqual(webMetadata.generator, "openapi-typescript", "Web generator");
  expectEqual(webMetadata.generatorVersion, "7.13.0", "Web generator version");
  expect(
    existsSync(absolute(paths.webGeneratedTypes)),
    `missing Web generated types: ${paths.webGeneratedTypes}`,
  );
}

expect(
  /^[0-9a-f]{40}$/u.test(expectedSourceCommit ?? ""),
  "client baseline source commit must be a full Git SHA",
);
expectEqual(
  clientBaseline.clients?.android?.snapshotPath,
  paths.androidSnapshot,
  "Android baseline snapshot path",
);
expectEqual(
  clientBaseline.clients?.webTeacherAdmin?.snapshotPath,
  paths.webSnapshot,
  "Web baseline snapshot path",
);
expectEqual(
  clientBaseline.clients?.webTeacherAdmin?.generatedTypesPath,
  paths.webGeneratedTypes,
  "Web generated baseline path",
);
expectEqual(
  clientBaseline.clients?.ios?.projectPresent,
  false,
  "iOS project presence",
);

if (failures.length > 0) {
  console.error("Client contract baseline: FAIL");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(
  `Client contract baseline: PASS (version=${expectedVersion}, sha256=${expectedSha256}, operations=${expectedOperationCount}, clients=${isBackendPublicationMirror ? 0 : 2}, iosProject=absent, stagingRuntimeReady=false)`,
);
