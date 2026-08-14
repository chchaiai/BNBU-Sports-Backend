import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import YAML from "yaml";

const repositoryRoot = resolve("../..");
const canonicalPath = resolve(
  repositoryRoot,
  "docs/backend-contracts/openapi.yaml",
);
const publishedHash =
  "c5d18c4894bbe421074cba27da3b39a9076328c499cc742b273665994c29059b";
const publishedSnapshotPath = resolve(
  repositoryRoot,
  "docs/backend-contracts/contract-history",
  `1.4.0-contract-${publishedHash}`,
  "openapi.snapshot.yaml",
);
const compatibilityJsonPath = resolve(
  repositoryRoot,
  "docs/backend-contracts/openapi-1.4-to-1.5-compatibility.json",
);
const compatibilityMarkdownPath = resolve(
  repositoryRoot,
  "docs/backend-contracts/openapi-1.4-to-1.5-compatibility.md",
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
  throw new Error("Immutable Contract 1.4 hash mismatch");
const document = YAML.parse(canonical);
if (document.info.version !== "1.5.0-contract") {
  throw new Error(
    `Candidate version must be 1.5.0-contract, got ${document.info.version}`,
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
const releaseDirectory = resolve(
  repositoryRoot,
  "docs/backend-contracts/releases/1.5.0-contract",
);
const snapshotRelative =
  "docs/backend-contracts/releases/1.5.0-contract/openapi.candidate.yaml";
const metadata = {
  formatVersion: 1,
  contractVersion: document.info.version,
  openapiVersion: document.openapi,
  sha256: candidateHash,
  byteLength: Buffer.byteLength(canonical),
  sourceCommit: provenance.sourceCommit,
  canonicalPath: "docs/backend-contracts/openapi.yaml",
  immutableCandidateSnapshot: snapshotRelative,
  publishedBaseline: {
    version: "1.4.0-contract",
    sha256: publishedHash,
    sourceCommit: "75235c4ab46b909d0b0b487d5de954f120fdf15d",
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
};

const manifest = `${JSON.stringify(metadata, null, 2)}\n`;
const changelog = `# Contract 1.5.0 Candidate Changelog

Baseline: immutable \`1.4.0-contract\` SHA-256 \`${publishedHash}\`.

- Preserves the published Contract 1.4 snapshot and advances the mutable API surface under the new \`1.5.0-contract\` version.
- Makes exercise descriptions required only for \`GENERAL\` records; \`COURSE_RELATED\` descriptions may be omitted or null.
- Adds byte-level WebM validation for browser-recorded exercise videos while retaining the 15-second maximum and mandatory video and audio tracks.
- Clarifies that clients must not request GPS permission or collect coordinates for evidence upload. Recognized GPS, EXIF location, or container location metadata is rejected with \`MEDIA_LOCATION_METADATA_NOT_ALLOWED\`.
- Keeps SHA-256, declared MIME, actual container, duration, track, and size verification authoritative on the Backend.
- Adds the ADMIN-only \`GET /health/admin\` projection for measured PostgreSQL, notification-outbox, roster-object-storage, and media-storage status without changing the public readiness response.
- Clarifies that QR enrollment remains a pre-authentication capability flow: join returns a restricted \`PENDING_CONTACT_BINDING\` session, email verification activates that session, and protected student operations remain blocked until activation.
- Adds lossless exemption application details for 800m, 1000m, school-team, student-club, and special-circumstance applications through additive request fields and \`GET /exemption-application-details\`, without changing the existing exemption response projection.
- Publishes the repository-owned local integration initializer and checker required to create a secret-safe Backend environment for Android, iOS, and Web synthetic E2E.
`;
const migrationNotes = `# Contract 1.5.0 Migration Notes

## Clients

iOS may generate and wire \`/api/v1\` types from this candidate handoff after its immutable SHA-256 is verified. Android and iOS must require a non-blank description for \`GENERAL\` records only; \`COURSE_RELATED\` may omit it. Web may upload a browser-produced \`video/webm\` file when it contains a video track, an audio track, and a trusted duration no greater than 15 seconds. MP4, MOV, and 3GP remain supported.

Updated clients create exemption applications with both \`applicationSubtype\` and \`organizationName\`; legacy clients may omit both. Read exact structured details from \`GET /api/v1/exemption-application-details\`. The original \`/exemption-applications\` mutation and list responses intentionally keep their prior projection for compatibility. QR join remains bearer-free and capability-authorized; its restricted session must complete email verification before any protected student operation.

No client is required or permitted by this contract to request location permission or collect coordinates for evidence. If a selected media file already contains recognized location metadata, Backend rejects it with \`MEDIA_LOCATION_METADATA_NOT_ALLOWED\`; clients should ask the user to remove location metadata or capture a new file.

## Database

Migration \`0016_optional_course_exercise_description\` makes \`exercise_records.description\` nullable and adds a database check that still requires a trimmed 1..200 character description for \`GENERAL\` rows. \`COURSE_RELATED\` rows may store null or a trimmed 1..200 character description. The migration is forward-only and must run before the application image.

Migration \`0017_exemption_application_details\` adds nullable \`application_subtype\` and \`organization_name\` columns plus a database combination constraint. Null/null preserves legacy rows; new clients use the typed combinations defined by ADR-104. This forward-only migration must run before clients use the structured details endpoint.

## Local integration

Run \`npm run local:env:init\` from the monorepo root to generate a gitignored Backend environment with fresh synthetic-only secrets, then run \`npm run local:env:check\` before Docker Compose. Do not use templates containing \`CHANGE_ME\`, reuse production credentials, or log generated secrets.

## Media deployment

No FFmpeg/WASM or upload-time transcoding service is introduced. Backend validates the original uploaded bytes. Media scanner, object storage, and HTTPS staging configuration remain deployment concerns and are not proven by this candidate package.

## Operational health

\`GET /api/v1/health/admin\` requires an ADMIN access token and returns safe dependency categories, latency, and notification backlog. The published \`/health/live\` and \`/health/ready\` projections remain unchanged. The administrator response never exposes endpoints, bucket credentials, storage keys, or signed URLs.
`;
const checklist = `# Contract 1.5.0 Post-Merge Release Checklist

This pull request prepares artifacts only. Do not create a tag or GitHub Release before merge.

1. On the merged default branch, run \`npm --prefix backend run repo-layout:check\`.
2. Run \`npm --prefix tools/backend-contracts run contract:release:check\` and the full backend CI workflow.
3. Confirm \`docs/backend-contracts/openapi.yaml\` still hashes to \`${candidateHash}\`.
4. Copy the candidate snapshot into \`docs/backend-contracts/contract-history/1.5.0-contract-${candidateHash}/\` with its manifest in a dedicated post-merge release commit.
5. Update the current-baseline pointer only in that release commit.
6. Create the approved Git tag and GitHub Release from the verified merged commit; attach the manifest, OpenAPI snapshot, compatibility reports, changelog, migration notes, and client handoff.
7. If any hash or gate differs, stop and forward-fix; never overwrite a historical snapshot.
`;
const handoff = `# BNBU Sports Contract 1.5.0 Candidate Handoff

| Item | Value |
| --- | --- |
| Canonical OpenAPI | \`docs/backend-contracts/openapi.yaml\` |
| Candidate version | \`${document.info.version}\` |
| OpenAPI version | \`${document.openapi}\` |
| SHA-256 | \`${candidateHash}\` |
| Source baseline commit | \`${metadata.sourceCommit}\` |
| Operations | ${metadata.counts.operations} |
| Schemas | ${metadata.counts.schemas} |
| Compatibility vs 1.4 | PASS; 0 unapproved blockers |
| Enabled operations | ${metadata.runtime.implementedAndConformant} |
| Intentionally disabled | ${metadata.runtime.intentionallyDisabled} |
| Not implemented | 0 |

The ${metadata.runtime.intentionallyDisabled} disabled operations remain real authenticated routes that fail closed. This handoff authorizes neither location collection nor GPS permission requests. It adds original-byte WebM verification, not transcoding. Clients must retain photo evidence as a supported path and surface stable media validation errors. Updated clients use \`GET /api/v1/exemption-application-details\` for lossless exemption subtype and organization fields; QR join still completes email verification before the restricted session becomes active.
`;
const currentHandoff = `# BNBU Sports Backend Current Handoff

The only canonical API contract is \`docs/backend-contracts/openapi.yaml\`.

- Candidate: \`${document.info.version}\`
- OpenAPI: \`${document.openapi}\`
- SHA-256: \`${candidateHash}\`
- Surface: ${metadata.counts.paths} paths / ${metadata.counts.operations} operations / ${metadata.counts.schemas} schemas
- Runtime: ${metadata.runtime.implementedAndConformant} implemented and conformant / ${metadata.runtime.intentionallyDisabled} intentionally disabled / 0 not implemented
- Published baseline: \`1.4.0-contract\` SHA-256 \`${publishedHash}\`, immutable
- Breaking gate: PASS, 0 unapproved blockers
- Release state: candidate artifacts prepared; no Git tag or GitHub Release created

See \`docs/backend-contracts/releases/1.5.0-contract/release-manifest.json\`, \`docs/backend-contracts/OPERATION-COMPLETION-MATRIX.md\`, and \`docs/client-handoff/CONTRACT-1.5.0-HANDOFF.md\`.
`;
const pointer = `${JSON.stringify(
  {
    currentCandidate: document.info.version,
    sha256: candidateHash,
    canonicalPath: "docs/backend-contracts/openapi.yaml",
    releaseManifest:
      "docs/backend-contracts/releases/1.5.0-contract/release-manifest.json",
    publishedBaseline: { version: "1.4.0-contract", sha256: publishedHash },
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
    resolve(repositoryRoot, "docs/client-handoff/CONTRACT-1.5.0-HANDOFF.md"),
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
