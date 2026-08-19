# BNBU Sports Contract 2.0.6 Release Handoff

| Item | Value |
| --- | --- |
| Canonical OpenAPI | `docs/backend-contracts/openapi.yaml` |
| Contract version | `2.0.6-contract` |
| Release state | `published` |
| OpenAPI version | `3.1.0` |
| SHA-256 | `099e7abbac3d7e3ce4f3a928d6863cd2486f4e957ae6be7b950c88384e45ce79` |
| Source baseline commit | `cadb539aeec51a891a052abec7ae04397263ed03` |
| Operations | 126 |
| Schemas | 288 |
| Compatibility vs 2.0.5-contract | PASS; 0 unapproved blockers |
| Enabled operations | 109 |
| Intentionally disabled | 17 |
| Not implemented | 0 |

The 17 disabled operations remain real authenticated routes that fail closed. This release makes the non-root migrator image readable even when built from a mode-protected server source archive, while retaining strict TencentDB CA validation; the client-visible API surface is unchanged. Clients should update their pinned contract version and SHA-256 after the published Release assets are verified, without changing request or response models.
