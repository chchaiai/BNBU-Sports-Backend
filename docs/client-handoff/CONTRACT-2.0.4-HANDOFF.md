# BNBU Sports Contract 2.0.4 Release Handoff

| Item | Value |
| --- | --- |
| Canonical OpenAPI | `docs/backend-contracts/openapi.yaml` |
| Contract version | `2.0.4-contract` |
| Release state | `published` |
| OpenAPI version | `3.1.0` |
| SHA-256 | `fb58079a167a1ac6208618bc1b2ac106f618a53be5418936992c1ddf36e85b47` |
| Source baseline commit | `a3f6cf4587028153a84f531aa2e5cbfd3eb415ce` |
| Operations | 126 |
| Schemas | 288 |
| Compatibility vs 2.0.3-contract | PASS; 0 unapproved blockers |
| Enabled operations | 109 |
| Intentionally disabled | 17 |
| Not implemented | 0 |

The 17 disabled operations remain real authenticated routes that fail closed. This release fixes the non-root Docker Compose FILE_JSON read contract with dedicated supplemental GID `10001`; the client-visible API surface is unchanged. Clients should update their pinned contract version and SHA-256 after the published Release assets are verified, without changing request or response models.
