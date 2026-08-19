# BNBU Sports Contract 2.0.5 Release Handoff

| Item | Value |
| --- | --- |
| Canonical OpenAPI | `docs/backend-contracts/openapi.yaml` |
| Contract version | `2.0.5-contract` |
| Release state | `published` |
| OpenAPI version | `3.1.0` |
| SHA-256 | `86b2607e0922c70d4e7c7866f4578952babc103e57daa14f42c3b4619b34ccf8` |
| Source baseline commit | `aa208c53762cef8946f703c08693f532daeef946` |
| Operations | 126 |
| Schemas | 288 |
| Compatibility vs 2.0.4-contract | PASS; 0 unapproved blockers |
| Enabled operations | 109 |
| Intentionally disabled | 17 |
| Not implemented | 0 |

The 17 disabled operations remain real authenticated routes that fail closed. This release adds persistent strict TencentDB CA validation to runtime and migration containers; the client-visible API surface is unchanged. Clients should update their pinned contract version and SHA-256 after the published Release assets are verified, without changing request or response models.
