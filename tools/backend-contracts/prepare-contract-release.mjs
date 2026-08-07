import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import YAML from "yaml";

const repositoryRoot = resolve("../..");
const canonicalPath = resolve(
  repositoryRoot,
  "docs/backend-contracts/openapi.yaml",
);
const publishedHash =
  "914084874afda2481813a041da4cc01249aa9ea557d9a8bf29baeed4f10e0dc9";
const publishedSnapshotPath = resolve(
  repositoryRoot,
  "docs/backend-contracts/contract-history",
  `1.3.0-contract-${publishedHash}`,
  "openapi.snapshot.yaml",
);
const compatibilityJsonPath = resolve(
  repositoryRoot,
  "docs/backend-contracts/openapi-1.3-to-1.4-compatibility.json",
);
const compatibilityMarkdownPath = resolve(
  repositoryRoot,
  "docs/backend-contracts/openapi-1.3-to-1.4-compatibility.md",
);
const runtimeManifestPath = resolve(
  repositoryRoot,
  "backend/runtime-coverage.manifest.json",
);
const provenancePath = resolve(
  repositoryRoot,
  "tools/backend-contracts/release-provenance.json",
);
const check = process.argv.includes("--check");

function sha256(contents) {
  return createHash("sha256").update(contents).digest("hex");
}

function countOperations(document) {
  const methods = new Set(["get", "post", "put", "patch", "delete"]);
  return Object.values(document.paths).reduce(
    (count, pathItem) =>
      count +
      Object.keys(pathItem).filter((method) => methods.has(method)).length,
    0,
  );
}

function writeOrCheck(path, expected) {
  if (check) {
    let actual;
    try {
      actual = readFileSync(path, "utf8");
    } catch {
      throw new Error(`Release artifact is missing: ${path}`);
    }
    if (actual !== expected)
      throw new Error(`Release artifact is stale or modified: ${path}`);
    return;
  }
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, expected);
}

const canonical = readFileSync(canonicalPath, "utf8");
const published = readFileSync(publishedSnapshotPath, "utf8");
if (sha256(published) !== publishedHash)
  throw new Error("Immutable Contract 1.3 hash mismatch");
const document = YAML.parse(canonical);
if (document.info.version !== "1.4.0-contract") {
  throw new Error(
    `Candidate version must be 1.4.0-contract, got ${document.info.version}`,
  );
}
if (document.openapi !== "3.1.0")
  throw new Error(`Unexpected OpenAPI version: ${document.openapi}`);
const compatibility = JSON.parse(readFileSync(compatibilityJsonPath, "utf8"));
if (
  !compatibility.compatible ||
  compatibility.summary.unapprovedBlockers !== 0
) {
  throw new Error("Compatibility report contains unapproved blockers");
}
const runtime = JSON.parse(readFileSync(runtimeManifestPath, "utf8"));
const provenance = JSON.parse(readFileSync(provenancePath, "utf8"));
if (
  provenance.formatVersion !== 1 ||
  provenance.contractVersion !== document.info.version ||
  !/^[0-9a-f]{40}$/.test(provenance.sourceCommit)
) {
  throw new Error(
    "Release provenance is invalid or does not match the candidate",
  );
}
const candidateHash = sha256(canonical);
const historyRelative = `docs/backend-contracts/contract-history/${document.info.version}-${candidateHash}`;
const historyDirectory = resolve(repositoryRoot, historyRelative);
const historySnapshotRelative = `${historyRelative}/openapi.snapshot.yaml`;
const historySnapshotPath = resolve(historyDirectory, "openapi.snapshot.yaml");
const historyManifestPath = resolve(historyDirectory, "manifest.json");
const historySnapshotExists = existsSync(historySnapshotPath);
const historyManifestExists = existsSync(historyManifestPath);
if (historySnapshotExists !== historyManifestExists) {
  throw new Error(
    "Published Contract 1.4 history must contain both snapshot and manifest",
  );
}
let publishedHistory = null;
if (historySnapshotExists) {
  const historySnapshot = readFileSync(historySnapshotPath, "utf8");
  const historyManifest = JSON.parse(readFileSync(historyManifestPath, "utf8"));
  if (
    historySnapshot !== canonical ||
    sha256(historySnapshot) !== candidateHash
  ) {
    throw new Error(
      "Published Contract 1.4 snapshot is not byte-identical to the canonical contract",
    );
  }
  if (
    historyManifest.formatVersion !== 1 ||
    historyManifest.version !== document.info.version ||
    historyManifest.sha256 !== candidateHash ||
    historyManifest.byteLength !== Buffer.byteLength(canonical) ||
    !/^[0-9a-f]{40}$/.test(historyManifest.sourceCommit) ||
    historyManifest.sourcePath !== "docs/backend-contracts/openapi.yaml" ||
    historyManifest.snapshotPath !== historySnapshotRelative ||
    historyManifest.immutable !== true
  ) {
    throw new Error("Published Contract 1.4 history manifest is invalid");
  }
  publishedHistory = historyManifest;
}
const isPublished = publishedHistory !== null;
const releaseDirectory = resolve(
  repositoryRoot,
  "docs/backend-contracts/releases/1.4.0-contract",
);
const snapshotRelative =
  "docs/backend-contracts/releases/1.4.0-contract/openapi.candidate.yaml";
const metadata = {
  formatVersion: 1,
  contractVersion: document.info.version,
  releaseState: isPublished ? "PUBLISHED" : "CANDIDATE",
  openapiVersion: document.openapi,
  sha256: candidateHash,
  byteLength: Buffer.byteLength(canonical),
  sourceCommit: provenance.sourceCommit,
  canonicalPath: "docs/backend-contracts/openapi.yaml",
  immutableCandidateSnapshot: snapshotRelative,
  publishedBaseline: {
    version: "1.3.0-contract",
    sha256: publishedHash,
    sourceCommit: "4b4f88b69fb2c3e07e7401650e0107360dd28b12",
  },
  counts: {
    paths: Object.keys(document.paths).length,
    operations: countOperations(document),
    schemas: Object.keys(document.components.schemas).length,
  },
  compatibility: {
    result: "PASS",
    classifiedChanges: compatibility.changes.length,
    unapprovedBlockers: 0,
  },
  runtime: {
    implementedAndConformant:
      Object.keys(runtime.implemented).length -
      runtime.implementedDefaultDeny.length,
    intentionallyDisabled: runtime.implementedDefaultDeny.length,
    notImplemented: 0,
  },
  ...(isPublished
    ? {
        publishedSnapshot: historySnapshotRelative,
        publishedFromCommit: publishedHistory.sourceCommit,
      }
    : {}),
};

const manifest = `${JSON.stringify(metadata, null, 2)}\n`;
const changelog = `# Contract 1.4.0${isPublished ? "" : " Candidate"} Changelog

Baseline: immutable \`1.3.0-contract\` SHA-256 \`${publishedHash}\`.

- Preserves all 122 published operations and all prior request/response schema alternatives.
- Documents every globally reachable SystemMode mutation response and the Export read fail-closed response.
- Defines mutually exclusive \`listStudentScores.status\` semantics and aligns the runtime projection with the published flat StudentScore transport.
- Records all 16 Contract 1.3 errata without narrowing the 1.3 request schema: endpoint runtime vocabularies use \`x-runtime-enum\`; compatibility-only Score sort fields are deprecated and explicitly unsupported.
- Accepts both RFC3339 time values and organization-local wall-clock values for class-section local-time fields while retaining the prior format alternative.
- Adds an explicit UNLICENSED identifier and scoped Redocly suppressions with removal conditions.
- Adds no path removal, method removal, required request field, response field removal, security weakening, permission change, or unapproved breaking change.
`;
const migrationNotes = `# Contract 1.4.0 Migration Notes

## Clients

No immediate Android, Web, or iOS source change is required. Existing \`/api/v1\` paths, methods, fields, and enum values remain available. Clients should consume \`listStudentScores.status\` as the documented aggregate status and must not assume the three deprecated Score \`sort\` parameters influence ordering.

## Database

Migration \`0013_production_rate_limits\` adds durable, HMAC-scoped authentication and QR-join rate-limit windows. It is forward-only and does not rewrite business records. Deploy migrations before the application image.

## Deferred breaking cleanup

A future \`/api/v2\` may replace open strings with closed endpoint enums and remove deprecated compatibility-only Score sort inputs. That change requires a new compatibility review and client migration; it is not part of this candidate.
`;
const checklist = `# Contract 1.4.0 Post-Merge Release Checklist

This pull request prepares artifacts only. Do not create a tag or GitHub Release before merge.

1. On the merged default branch, run \`npm --prefix backend run repo-layout:check\`.
2. Run \`npm --prefix tools/backend-contracts run contract:release:check\` and the full backend CI workflow.
3. Confirm \`docs/backend-contracts/openapi.yaml\` still hashes to \`${candidateHash}\`.
4. Copy the candidate snapshot into \`docs/backend-contracts/contract-history/1.4.0-contract-${candidateHash}/\` with its manifest in a dedicated post-merge release commit.
5. Update the current-baseline pointer only in that release commit.
6. Create the approved Git tag and GitHub Release from the verified merged commit; attach the manifest, OpenAPI snapshot, compatibility reports, changelog, migration notes, and client handoff.
7. If any hash or gate differs, stop and forward-fix; never overwrite a historical snapshot.
`;
const handoff = `# BNBU Sports Contract 1.4.0 ${isPublished ? "Published" : "Candidate"} Handoff

| Item | Value |
| --- | --- |
| Canonical OpenAPI | \`docs/backend-contracts/openapi.yaml\` |
| Contract version | \`${document.info.version}\` |
| Release state | \`${isPublished ? "PUBLISHED" : "CANDIDATE"}\` |
| OpenAPI version | \`${document.openapi}\` |
| SHA-256 | \`${candidateHash}\` |
| Source commit containing the canonical contract | \`${metadata.sourceCommit}\` |
| Operations | ${metadata.counts.operations} |
| Schemas | ${metadata.counts.schemas} |
| Compatibility vs 1.3 | PASS; 0 unapproved blockers |
| Enabled operations | ${metadata.runtime.implementedAndConformant} |
| Intentionally disabled | ${metadata.runtime.intentionallyDisabled} |
| Not implemented | 0 |

The 18 disabled operations remain real authenticated routes that fail closed; this handoff does not authorize Export, profile mutation, location collection, or other unapproved capabilities. Client source code was not changed by this contract release.
`;
const currentHandoff = isPublished
  ? `# BNBU Sports Backend Current Handoff

The only canonical API contract is \`docs/backend-contracts/openapi.yaml\`.

- Published contract: \`${document.info.version}\`
- OpenAPI: \`${document.openapi}\`
- SHA-256: \`${candidateHash}\`
- Immutable snapshot: \`${historySnapshotRelative}\`
- Surface: ${metadata.counts.paths} paths / ${metadata.counts.operations} operations / ${metadata.counts.schemas} schemas
- Runtime: ${metadata.runtime.implementedAndConformant} implemented and conformant / ${metadata.runtime.intentionallyDisabled} intentionally disabled / 0 not implemented
- Previous published baseline: \`1.3.0-contract\` SHA-256 \`${publishedHash}\`, immutable
- Breaking gate: PASS, 0 unapproved blockers
- Release state: published as \`${document.info.version}\`

See \`docs/backend-contracts/releases/1.4.0-contract/release-manifest.json\`, \`docs/backend-contracts/OPERATION-COMPLETION-MATRIX.md\`, and \`docs/client-handoff/CONTRACT-1.4.0-HANDOFF.md\`.
`
  : `# BNBU Sports Backend Current Handoff

The only canonical API contract is \`docs/backend-contracts/openapi.yaml\`.

- Candidate: \`${document.info.version}\`
- OpenAPI: \`${document.openapi}\`
- SHA-256: \`${candidateHash}\`
- Surface: ${metadata.counts.paths} paths / ${metadata.counts.operations} operations / ${metadata.counts.schemas} schemas
- Runtime: ${metadata.runtime.implementedAndConformant} implemented and conformant / ${metadata.runtime.intentionallyDisabled} intentionally disabled / 0 not implemented
- Published baseline: \`1.3.0-contract\` SHA-256 \`${publishedHash}\`, immutable
- Breaking gate: PASS, 0 unapproved blockers
- Release state: candidate artifacts prepared; no Git tag or GitHub Release created

See \`docs/backend-contracts/releases/1.4.0-contract/release-manifest.json\`, \`docs/backend-contracts/OPERATION-COMPLETION-MATRIX.md\`, and \`docs/client-handoff/CONTRACT-1.4.0-HANDOFF.md\`.
`;
const pointer = `${JSON.stringify(
  isPublished
    ? {
        currentPublished: document.info.version,
        releaseState: "PUBLISHED",
        sha256: candidateHash,
        canonicalPath: "docs/backend-contracts/openapi.yaml",
        releaseManifest:
          "docs/backend-contracts/releases/1.4.0-contract/release-manifest.json",
        immutableSnapshot: historySnapshotRelative,
        previousPublishedBaseline: {
          version: "1.3.0-contract",
          sha256: publishedHash,
        },
      }
    : {
        currentCandidate: document.info.version,
        releaseState: "CANDIDATE",
        sha256: candidateHash,
        canonicalPath: "docs/backend-contracts/openapi.yaml",
        releaseManifest:
          "docs/backend-contracts/releases/1.4.0-contract/release-manifest.json",
        publishedBaseline: { version: "1.3.0-contract", sha256: publishedHash },
      },
  null,
  2,
)}\n`;

const artifacts = new Map([
  [resolve(releaseDirectory, "openapi.candidate.yaml"), canonical],
  [resolve(releaseDirectory, "release-manifest.json"), manifest],
  [
    resolve(releaseDirectory, "contract-diff.json"),
    `${JSON.stringify(compatibility, null, 2)}\n`,
  ],
  [
    resolve(releaseDirectory, "contract-diff.md"),
    readFileSync(compatibilityMarkdownPath, "utf8"),
  ],
  [resolve(releaseDirectory, "CHANGELOG.md"), changelog],
  [resolve(releaseDirectory, "MIGRATION-NOTES.md"), migrationNotes],
  [resolve(releaseDirectory, "RELEASE-CHECKLIST.md"), checklist],
  [
    resolve(repositoryRoot, "docs/client-handoff/CONTRACT-1.4.0-HANDOFF.md"),
    handoff,
  ],
  [
    resolve(repositoryRoot, "docs/backend-contracts/CURRENT-HANDOFF.md"),
    currentHandoff,
  ],
  [
    resolve(repositoryRoot, "docs/backend-contracts/current-contract.json"),
    pointer,
  ],
]);
for (const [path, contents] of artifacts) writeOrCheck(path, contents);
console.log(
  `Contract release ${check ? "check" : "prepare"}: PASS (${document.info.version}, sha256=${candidateHash}, artifacts=${artifacts.size}).`,
);
