# BNBU Sports Contract 2.0.8 Release Handoff

| Item | Value |
| --- | --- |
| Canonical OpenAPI | `docs/backend-contracts/openapi.yaml` |
| Contract version | `2.0.8-contract` |
| Release state | `published` |
| OpenAPI version | `3.1.0` |
| SHA-256 | `437398a9fc40ad93e2d8c438c5e3a9353058aac37cbea6f585202b08215dd3c4` |
| Source baseline commit | `bef4590190fc6d0c086d91badb2252884a6b37e8` |
| Operations | 126 |
| Schemas | 288 |
| Compatibility vs 2.0.7-contract | PASS; 0 unapproved blockers |
| Enabled operations | 109 |
| Intentionally disabled | 17 |
| Not implemented | 0 |

The 17 disabled operations remain real authenticated routes that fail closed. This release makes staging health verification authenticated and secret-isolated while enforcing HTTPS-only CORS outside local/test environments; the client-visible API surface is unchanged. Clients should update their pinned contract version and SHA-256 after the published Release assets are verified, without changing request or response models.
