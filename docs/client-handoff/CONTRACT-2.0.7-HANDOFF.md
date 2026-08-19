# BNBU Sports Contract 2.0.7 Release Handoff

| Item | Value |
| --- | --- |
| Canonical OpenAPI | `docs/backend-contracts/openapi.yaml` |
| Contract version | `2.0.7-contract` |
| Release state | `published` |
| OpenAPI version | `3.1.0` |
| SHA-256 | `24967f0ec3f054ccde4aa7843c9b89e750fd2fd3bd237467b6665496301491cb` |
| Source baseline commit | `79c9c9b1ded94c3e78232e79eec53059a8b57ea8` |
| Operations | 126 |
| Schemas | 288 |
| Compatibility vs 2.0.6-contract | PASS; 0 unapproved blockers |
| Enabled operations | 109 |
| Intentionally disabled | 17 |
| Not implemented | 0 |

The 17 disabled operations remain real authenticated routes that fail closed. This release verifies TencentDB certificates against the PostgreSQL URL host even when `node-postgres` supplies `localhost` for an IP connection; complete CA-chain validation remains strict and the client-visible API surface is unchanged. Clients should update their pinned contract version and SHA-256 after the published Release assets are verified, without changing request or response models.
