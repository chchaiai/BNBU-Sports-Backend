# Tencent Cloud staging configuration

This document defines the staging configuration boundary for BNBU Sports. It does not authorize deployment, cloud-resource changes, or TencentDB migration.

## Frozen values

| Setting                 | Frozen staging value              |
| ----------------------- | --------------------------------- |
| Tencent Cloud region    | `ap-guangzhou`                    |
| API origin              | `https://api.verityai.cn`         |
| Web CORS origin         | deferred until Phase 11           |
| Email provider          | `TENCENT_SES`                     |
| SES sender              | `no-reply@verityai.cn`            |
| SES template ID         | `56852`                           |
| COS bucket              | `sports-staging-media-1443273655` |
| Media scanner           | `TEST_SIGNATURE`                  |
| Runtime secret provider | `FILE_JSON`                       |
| COS credential provider | `TENCENT_CVM_ROLE`                |

`TEST_SIGNATURE` is staging-only and is not an external malware-scanning control.

## Secret and trust boundaries

Provision three UTF-8 JSON files and one complete TencentDB CA chain outside Git, then mount only the files needed by each Docker Compose service. Never put JSON values in this repository, Docker image, deployment report, or command-line arguments.

- Runtime file target: `/run/secrets/bnbu_runtime.json`; it may contain only the names listed in `runtimeSecret` in `config/staging-configuration-requirements.json`.
- Migrator file target: `/run/secrets/bnbu_migrator.json`; it may contain only `MIGRATION_DATABASE_URL`.
- Synthetic health fixture target: `/run/secrets/bnbu_staging_fixture.json`; it may contain only `STAGING_ADMIN_PASSWORD`, is mounted only by the `operations` profile, and is never mounted by the long-running Backend or migrator.
- TencentDB CA target: `/run/secrets/tencentdb-ca-chain.pem`; it must contain the TencentDB intermediate and root CA certificates in PEM form.

On the Compose host, all four source files must be owned by `root:10001` with mode `0640`. GID `10001` is the dedicated secret-reader group: the Backend image already uses it as the `bnbu` runtime group, and Compose adds it as a supplemental group to Backend, migrator, and health-operator containers. Local Docker Compose mounts file-backed secrets without remapping host ownership, so `root:root 0600` is intentionally rejected as unreadable by the non-root services. Do not add interactive host users to GID `10001`.

The Backend service mounts the runtime JSON plus the shared CA chain. The migration profile mounts the migrator JSON plus the same CA chain. The operations profile mounts the runtime JSON, fixture JSON, and CA chain only for the lifetime of a one-shot health operation. No long-running service can read the fixture password, and the health operator cannot read the migrator credential. The JSON loaders reject unknown keys, missing keys, duplicate environment values, invalid UTF-8, relative paths, and oversized files. The CA loader rejects relative paths, invalid PEM, leaf certificates, incomplete chains, and files larger than 128 KiB. Staging and production fail closed when `RUNTIME_SECRET_PROVIDER` is not `FILE_JSON` or the CA chain is unavailable.

Runtime `PrismaPg` receives explicit host, port, user, password, database, and strict TLS options so a connection-string parser cannot overwrite the CA configuration. The migration launcher injects the persisted chain through `SSL_CERT_FILE` and upgrades the child-only URL to `sslmode=verify-full` plus `sslaccept=strict`. No URL or certificate body is printed.

COS and SES use the CVM instance role. COS credentials are obtained from instance metadata as automatically refreshed STS credentials including the security token. Static COS SecretId and SecretKey values are rejected in staging and production. Apply `config/tencent-cloud-staging-cam-policy.json` and `config/tencent-cloud-staging-ses-cam-policy.json` to the role, verify both capabilities, and then remove `QcloudCOSDataFullControl` and `QcloudSESFullAccess`. The custom COS policy is limited to the staging bucket's `roster-sources/*` and `media/*` prefixes and contains no bucket-delete or wildcard actions. The custom SES policy allows only the operation-level `SendEmail` API; Tencent Cloud requires `resource: "*"` for that operation-level action.

## Missing-configuration mechanism

The manifest at `config/staging-configuration-requirements.json` is the authoritative inventory. Every item records its owner and source.

Run a local name-only check:

```bash
node --env-file=config/staging.env.example scripts/check-staging-configuration.mjs
```

Read and validate all three JSON files plus the CA chain by status only in an authorized preflight context:

```bash
npm run staging:config:check:files
```

Both commands print statuses and configuration names only. They never print secret values or certificate bodies. `--files` validates that all three JSON files contain exactly the allowed key names and that the CA chain is complete. The health operator applies the additional fixture-password length and placeholder checks at execution time. Normal runtime and migration containers remain isolated and never mount the fixture JSON.

The staging Compose definition is `docker-compose.staging.yml`. It binds the Backend only to `127.0.0.1:3000`, requires immutable runtime and migrator image references, mounts each service's secrets separately, grants only supplemental GID `10001` for file reads, drops Linux capabilities, enables a read-only root filesystem, and keeps migration and health operations behind explicit profiles.

`CORS_ALLOWLIST=https://web-origin-not-configured.invalid` is a reserved, non-routable sentinel. It keeps browser access closed while Phase 11 has no verified Web deployment origin. Staging and production reject every HTTP CORS origin. Replace the sentinel only with the exact deployed HTTPS origin, then configure the same exact origin in COS if browser direct upload or read is enabled.

The health operator has two commands. `bootstrap` creates or verifies one isolated synthetic organization and ADMIN in a single serializable transaction; it never updates, resets, or deletes conflicting data. `verify` logs in over the private Compose network, calls authenticated admin health, verifies the request ID and all dependency states, and logs out. Both commands require the exact `STAGING_BOOTSTRAP_CONFIRMATION` sentinel and an isolated fixture secret. Output is status-only and never includes the password, token, hash, internal IDs, or provider response bodies.

## Console inputs still required

Before Phase 2 can pass, a human must confirm or create the following in Tencent Cloud Console:

1. The runtime JSON file with the exact allowlist, the migrator JSON file containing only `MIGRATION_DATABASE_URL`, the isolated fixture JSON containing only `STAGING_ADMIN_PASSWORD`, and the complete TencentDB CA chain.
2. The `sports_staging_app` TencentDB runtime account and its least-privilege grants; `sports_staging_admin` remains the separate migration/schema account.
3. TencentDB SSL must reach the enabled state, and `sports-staging-pg-sg` must restrict `5432/tcp` to the CVM private identity. A similarly shaped rule on another security group does not satisfy this gate.
4. Replace the role's current `QcloudCOSDataFullControl` and `QcloudSESFullAccess` policies with the repository's exact COS and SES custom policies.
5. Verify from inside the Backend container that CVM metadata credentials can be obtained without exposing their values.
6. Add COS CORS for the exact deployed HTTPS Web origin only when browser direct upload/read is enabled. Do not add the API origin or the reserved `.invalid` sentinel.

`APP_VERSION` remains release-owned and must be replaced with the published Backend release version. Placeholder values beginning with `CHANGE_ME` intentionally fail the preflight.

## Operational gates

- A configuration check failure stops deployment before a container is started.
- A missing or invalid runtime JSON file stops Backend startup.
- A missing or invalid migrator JSON file stops migration before Prisma is launched.
- A missing, invalid, or incomplete TencentDB CA chain stops Backend construction or migration before database authentication.
- A CVM role credential or COS authorization failure maps to the stable storage-unavailable error without logging provider details.
- An SES API failure is retried at most three times and then returns the stable unavailable error; credentials and provider error bodies are not logged.
- Database migration remains a separately authorized operation and uses the migrator secret only.
- A fixture conflict or password mismatch stops the health operator without modifying existing data.
- The health verifier always attempts logout after a successful login and fails if authenticated admin health or logout is not HTTP 200.
