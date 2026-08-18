# Tencent Cloud staging configuration

This document defines the staging configuration boundary for BNBU Sports. It does not authorize deployment, cloud-resource changes, or TencentDB migration.

## Frozen values

| Setting                 | Frozen staging value              |
| ----------------------- | --------------------------------- |
| Tencent Cloud region    | `ap-guangzhou`                    |
| Web origin              | `http://129.204.146.192`          |
| Email provider          | `TENCENT_SES`                     |
| SES sender              | `no-reply@verityai.cn`            |
| SES template ID         | `56852`                           |
| COS bucket              | `sports-staging-media-1443273655` |
| Media scanner           | `TEST_SIGNATURE`                  |
| Runtime secret provider | `FILE_JSON`                       |
| COS credential provider | `TENCENT_CVM_ROLE`                |

`TEST_SIGNATURE` is staging-only and is not an external malware-scanning control.

## Secret boundaries

Provision two UTF-8 JSON files outside Git and mount them with Docker Compose secrets. Never put their values in this repository, Docker image, deployment report, or command-line arguments.

- Runtime file target: `/run/secrets/bnbu_runtime.json`; it may contain only the names listed in `runtimeSecret` in `config/staging-configuration-requirements.json`.
- Migrator file target: `/run/secrets/bnbu_migrator.json`; it may contain only `MIGRATION_DATABASE_URL`.

The Backend service mounts only the runtime file. The migration profile mounts only the migrator file. Both loaders reject unknown keys, missing keys, duplicate environment values, invalid UTF-8, relative paths, and files larger than 64 KiB. Staging and production fail closed when `RUNTIME_SECRET_PROVIDER` is not `FILE_JSON`.

COS and SES use the CVM instance role. COS credentials are obtained from instance metadata as automatically refreshed STS credentials including the security token. Static COS SecretId and SecretKey values are rejected in staging and production. Apply `config/tencent-cloud-staging-cam-policy.json` and `config/tencent-cloud-staging-ses-cam-policy.json` to the role, verify both capabilities, and then remove `QcloudCOSDataFullControl` and `QcloudSESFullAccess`. The custom COS policy is limited to the staging bucket's `roster-sources/*` and `media/*` prefixes and contains no bucket-delete or wildcard actions. The custom SES policy allows only the operation-level `SendEmail` API; Tencent Cloud requires `resource: "*"` for that operation-level action.

## Missing-configuration mechanism

The manifest at `config/staging-configuration-requirements.json` is the authoritative inventory. Every item records its owner and source.

Run a local name-only check:

```bash
node --env-file=config/staging.env.example scripts/check-staging-configuration.mjs
```

Read and validate both mounted files by name only in an authorized preflight context:

```bash
npm run staging:config:check:files
```

Both commands print statuses and configuration names only. They never print secret values. `--files` validates that both JSON files are available and contain exactly the allowed key names. Normal runtime and migration containers remain isolated and do not mount both files together.

The staging Compose definition is `docker-compose.staging.yml`. It binds the Backend only to `127.0.0.1:3000`, requires immutable runtime and migrator image references, mounts each service's secret separately, drops Linux capabilities, enables a read-only root filesystem, and keeps migration behind the explicit `migration` profile.

## Console inputs still required

Before Phase 2 can pass, a human must confirm or create the following in Tencent Cloud Console:

1. The runtime JSON file with the exact allowlist and the migrator JSON file containing only `MIGRATION_DATABASE_URL`.
2. The `sports_staging_app` TencentDB runtime account and its least-privilege grants; `sports_staging_admin` remains the separate migration/schema account.
3. TencentDB SSL must reach the enabled state, and `sports-staging-pg-sg` must restrict `5432/tcp` to the CVM private identity. A similarly shaped rule on another security group does not satisfy this gate.
4. Replace the role's current `QcloudCOSDataFullControl` and `QcloudSESFullAccess` policies with the repository's exact COS and SES custom policies.
5. Verify from inside the Backend container that CVM metadata credentials can be obtained without exposing their values.
6. Add COS CORS for the exact `http://129.204.146.192` origin only when the Web files are actually served by Nginx and browser direct upload/read is enabled.

`APP_VERSION` remains release-owned and must be replaced with the published Backend release version. Placeholder values beginning with `CHANGE_ME` intentionally fail the preflight.

## Operational gates

- A configuration check failure stops deployment before a container is started.
- A missing or invalid runtime JSON file stops Backend startup.
- A missing or invalid migrator JSON file stops migration before Prisma is launched.
- A CVM role credential or COS authorization failure maps to the stable storage-unavailable error without logging provider details.
- An SES API failure is retried at most three times and then returns the stable unavailable error; credentials and provider error bodies are not logged.
- Database migration remains a separately authorized operation and uses the migrator secret only.
