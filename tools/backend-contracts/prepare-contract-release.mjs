import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import YAML from "yaml";

const repositoryRoot = resolve("../..");
const releaseConfig = JSON.parse(
  readFileSync(resolve("release-config.json"), "utf8"),
);
if (releaseConfig.formatVersion !== 1)
  throw new Error("Unsupported contract release config format");
if (!["candidate", "published"].includes(releaseConfig.releaseState))
  throw new Error(`Unsupported release state: ${releaseConfig.releaseState}`);
const candidateVersion = releaseConfig.candidateVersion;
const candidateSemver = candidateVersion.replace(/-contract$/u, "");
const baselineVersion = releaseConfig.publishedBaseline.version;
const canonicalPath = resolve(
  repositoryRoot,
  "docs/backend-contracts/openapi.yaml",
);
const publishedHash = releaseConfig.publishedBaseline.sha256;
const publishedSnapshotPath = resolve(
  repositoryRoot,
  "docs/backend-contracts/contract-history",
  `${baselineVersion}-${publishedHash}`,
  "openapi.snapshot.yaml",
);
const compatibilityJsonPath = resolve(
  repositoryRoot,
  releaseConfig.compatibility.jsonPath,
);
const compatibilityMarkdownPath = resolve(
  repositoryRoot,
  releaseConfig.compatibility.markdownPath,
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
  throw new Error(`Immutable ${baselineVersion} hash mismatch`);
const document = YAML.parse(canonical);
if (document.info.version !== candidateVersion) {
  throw new Error(
    `Candidate version must be ${candidateVersion}, got ${document.info.version}`,
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
  `docs/backend-contracts/releases/${candidateVersion}`,
);
const snapshotRelative =
  `docs/backend-contracts/releases/${candidateVersion}/openapi.candidate.yaml`;
const metadata = {
  formatVersion: 1,
  contractVersion: document.info.version,
  releaseState: releaseConfig.releaseState,
  openapiVersion: document.openapi,
  sha256: candidateHash,
  byteLength: Buffer.byteLength(canonical),
  sourceCommit: provenance.sourceCommit,
  canonicalPath: "docs/backend-contracts/openapi.yaml",
  immutableCandidateSnapshot: snapshotRelative,
  publishedBaseline: {
    version: baselineVersion,
    sha256: publishedHash,
    sourceCommit: releaseConfig.publishedBaseline.sourceCommit,
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

const historyRelative =
  `docs/backend-contracts/contract-history/${candidateVersion}-${candidateHash}`;
if (releaseConfig.releaseState === "published") {
  metadata.immutableHistorySnapshot = `${historyRelative}/openapi.snapshot.yaml`;
  metadata.immutableHistoryManifest = `${historyRelative}/release-manifest.json`;
}
const manifest = `${JSON.stringify(metadata, null, 2)}\n`;
const changelog = `# Contract ${candidateSemver} ${releaseConfig.releaseState === "published" ? "Release" : "Candidate"} Changelog

Baseline: immutable \`${baselineVersion}\` SHA-256 \`${publishedHash}\`.

- Preserves the published ${baselineVersion} snapshot and advances the API surface under the unique \`${candidateVersion}\` version.
- Pins PostgreSQL certificate identity verification to the actual host parsed from the runtime or migration URL, including TencentDB private IP addresses.
- Prevents \`node-postgres\` from substituting \`localhost\` during IP-address certificate checks while retaining \`rejectUnauthorized: true\` and the complete TencentDB CA chain.
- Applies the same strict host check to the Runtime Prisma pool and the Migrator runtime-permission hardening client.
- Keeps the Backend application port bound to loopback in the staging Compose and retains Nginx as the future public entry point.
- Adds no database migration and no client-visible operation or schema change.
`;
const migrationNotes = `# Contract ${candidateSemver} Migration Notes

## Clients

No Android, iOS, or Web API payload change is required. Clients remain bound to the same 126 operations and 288 schemas; only the immutable release version and SHA-256 advance.

## Database

This release adds no Prisma migration. Staging still requires a dedicated business database, a schema-admin migration account, and a separate least-privilege runtime account. Creating the database is infrastructure preparation; applying the existing migration chain remains a separately authorized deployment phase.

## TencentDB TLS host identity

Runtime and Migrator PostgreSQL clients verify the certificate against the host parsed from their configured URL. This prevents an IP-address connection from being checked as \`localhost\` by \`node-postgres\`. The complete CA chain and \`rejectUnauthorized: true\` remain mandatory; do not add a hostname bypass, set \`sslmode=no-verify\`, or weaken certificate validation.

## Staging secrets

Mount \`bnbu_runtime.json\` and \`bnbu_migrator.json\` as separate Docker Compose secrets. The runtime file contains only runtime-managed keys; the migrator file contains only \`MIGRATION_DATABASE_URL\`. Mount the complete TencentDB intermediate and root CA chain at \`/run/secrets/tencentdb-ca-chain.pem\` in both containers. On the Compose host, all three source files must be owned by \`root:10001\` with mode \`0640\`; do not add interactive host users to that group. Do not duplicate managed keys in the container environment. Replace the staging environment template's \`APP_VERSION\` placeholder with this published release version before preflight.

## Tencent Cloud access

COS credentials are obtained from the bound CVM role and must be scoped by the published single-bucket policy. SES uses the bound role and the \`SendEmail\`-only policy. Cloud policy association, bucket access, template acceptance, and actual delivery remain deployment verification steps.

## Deployment boundary

Publishing this release does not deploy it, start a container, run a TencentDB migration, modify Nginx, or prove external COS or SES connectivity.
`;
const checklist = `# Contract ${candidateSemver} Post-Merge Release Checklist

Release state: \`${releaseConfig.releaseState}\`. Do not create a tag or GitHub Release before the candidate is merged, finalized, and revalidated on the authoritative commit.

1. On the merged default branch, run \`npm --prefix backend run repo-layout:check\`.
2. Run \`npm --prefix tools/backend-contracts run contract:release:check\` and the full backend CI workflow.
3. Confirm \`docs/backend-contracts/openapi.yaml\` still hashes to \`${candidateHash}\`.
4. Finalize the immutable snapshot at \`${historyRelative}/\` in a dedicated post-merge release commit.
5. Confirm the current-baseline pointer reports \`${candidateVersion}\` as \`published\` only in that release commit.
6. Create the approved Git tag and GitHub Release from the verified merged commit; attach the manifest, OpenAPI snapshot, compatibility reports, changelog, migration notes, and client handoff.
7. If any hash or gate differs, stop and forward-fix; never overwrite a historical snapshot.
`;
const handoff = `# BNBU Sports Contract ${candidateSemver} ${releaseConfig.releaseState === "published" ? "Release" : "Candidate"} Handoff

| Item | Value |
| --- | --- |
| Canonical OpenAPI | \`docs/backend-contracts/openapi.yaml\` |
| Contract version | \`${document.info.version}\` |
| Release state | \`${releaseConfig.releaseState}\` |
| OpenAPI version | \`${document.openapi}\` |
| SHA-256 | \`${candidateHash}\` |
| Source baseline commit | \`${metadata.sourceCommit}\` |
| Operations | ${metadata.counts.operations} |
| Schemas | ${metadata.counts.schemas} |
| Compatibility vs ${baselineVersion} | PASS; 0 unapproved blockers |
| Enabled operations | ${metadata.runtime.implementedAndConformant} |
| Intentionally disabled | ${metadata.runtime.intentionallyDisabled} |
| Not implemented | 0 |

The ${metadata.runtime.intentionallyDisabled} disabled operations remain real authenticated routes that fail closed. This release verifies TencentDB certificates against the PostgreSQL URL host even when \`node-postgres\` supplies \`localhost\` for an IP connection; complete CA-chain validation remains strict and the client-visible API surface is unchanged. Clients should update their pinned contract version and SHA-256 after the published Release assets are verified, without changing request or response models.
`;
const currentHandoff = `# BNBU Sports Backend Current Handoff

The only canonical API contract is \`docs/backend-contracts/openapi.yaml\`.

- Current contract: \`${document.info.version}\`
- Release state: \`${releaseConfig.releaseState}\`
- OpenAPI: \`${document.openapi}\`
- SHA-256: \`${candidateHash}\`
- Surface: ${metadata.counts.paths} paths / ${metadata.counts.operations} operations / ${metadata.counts.schemas} schemas
- Runtime: ${metadata.runtime.implementedAndConformant} implemented and conformant / ${metadata.runtime.intentionallyDisabled} intentionally disabled / 0 not implemented
- Previous published baseline: \`${baselineVersion}\` SHA-256 \`${publishedHash}\`, immutable
- Breaking gate: PASS, 0 unapproved blockers

See \`docs/backend-contracts/releases/${candidateVersion}/release-manifest.json\`, \`docs/backend-contracts/OPERATION-COMPLETION-MATRIX.md\`, and \`docs/client-handoff/CONTRACT-${candidateSemver}-HANDOFF.md\`.
`;
const pointer = `${JSON.stringify(
  {
    currentVersion: document.info.version,
    releaseState: releaseConfig.releaseState,
    sha256: candidateHash,
    canonicalPath: "docs/backend-contracts/openapi.yaml",
    releaseManifest:
      `docs/backend-contracts/releases/${candidateVersion}/release-manifest.json`,
    immutableHistory:
      releaseConfig.releaseState === "published" ? historyRelative : null,
    previousPublishedBaseline: {
      version: baselineVersion,
      sha256: publishedHash,
    },
  },
  null,
  2,
)}\n`;

const clientBaselinePath = resolve(
  repositoryRoot,
  "docs/client-handoff/client-contract-baseline.json",
);
const clientBaselineData = JSON.parse(readFileSync(clientBaselinePath, "utf8"));
clientBaselineData.status =
  releaseConfig.releaseState === "published"
    ? "CONTRACT_BASELINE_RELEASED"
    : "CONTRACT_BASELINE_BOUND_LOCAL";
clientBaselineData.closedAt = releaseConfig.releaseDate;
Object.assign(clientBaselineData.contract, {
  sourceCommit: metadata.sourceCommit,
  version: candidateVersion,
  sha256: candidateHash,
  operationCount: metadata.counts.operations,
  schemaCount: metadata.counts.schemas,
  enabledOperations: metadata.runtime.implementedAndConformant,
  intentionallyDisabledOperations: metadata.runtime.intentionallyDisabled,
  notImplementedOperations: metadata.runtime.notImplemented,
});
const clientBaseline = `${JSON.stringify(clientBaselineData, null, 2)}\n`;
const readmeFirst = `# BNBU Sports 客户端后端接入入口

当前客户端生成和适配只允许绑定以下唯一合同；不得从 Backend \`main\` 的未发布字节自动生成：

| 项目 | 值 |
| --- | --- |
| Version | \`${candidateVersion}\` |
| Release state | \`${releaseConfig.releaseState}\` |
| SHA-256 | \`${candidateHash}\` |
| Surface | ${metadata.counts.paths} paths / ${metadata.counts.operations} operations / ${metadata.counts.schemas} schemas |
| Runtime | ${metadata.runtime.implementedAndConformant} enabled / ${metadata.runtime.intentionallyDisabled} intentionally disabled / 0 not implemented |
| Source monorepo commit | \`${metadata.sourceCommit}\` |
| Machine baseline | \`client-contract-baseline.json\` |
| Current handoff | \`CONTRACT-${candidateSemver}-HANDOFF.md\` |

开发前依次核验 \`CONTRACT-${candidateSemver}-HANDOFF.md\`、\`client-contract-baseline.json\`、权威 OpenAPI 字节和 SHA-256。Android 与 Web 快照必须与权威 OpenAPI byte-identical；iOS 仓库位于 monorepo 之外，必须从正式 Release 资产导入并在自身仓库记录相同版本和 hash。

本地合同、客户端绑定或 Backend Release 均不表示 Staging 已部署、外部邮箱/COS 已验收、APNs 已启用或 Production Gate 已打开。
`;

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
    resolve(
      repositoryRoot,
      `docs/client-handoff/CONTRACT-${candidateSemver}-HANDOFF.md`,
    ),
    handoff,
  ],
  [resolve(repositoryRoot, "docs/client-handoff/README-FIRST.md"), readmeFirst],
  [clientBaselinePath, clientBaseline],
  [
    resolve(repositoryRoot, "docs/backend-contracts/CURRENT-HANDOFF.md"),
    currentHandoff,
  ],
  [
    resolve(repositoryRoot, "docs/backend-contracts/current-contract.json"),
    pointer,
  ],
]);
if (releaseConfig.releaseState === "published") {
  artifacts.set(
    resolve(repositoryRoot, historyRelative, "openapi.snapshot.yaml"),
    canonical,
  );
  artifacts.set(
    resolve(repositoryRoot, historyRelative, "release-manifest.json"),
    manifest,
  );
}
for (const [path, contents] of artifacts) writeOrCheck(path, contents);
console.log(
  `Contract release ${check ? "check" : "prepare"}: PASS (${document.info.version}, sha256=${candidateHash}, artifacts=${artifacts.size}).`,
);
