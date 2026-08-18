# BNBU Sports Contract 2.0.3 Release Handoff

| Item | Value |
| --- | --- |
| Canonical OpenAPI | `docs/backend-contracts/openapi.yaml` |
| Contract version | `2.0.3-contract` |
| Release state | `published` |
| OpenAPI version | `3.1.0` |
| SHA-256 | `382bc0bdffe872b8695d3d503ca0957cc95ff5ea8b786958cf62bd277edda7a2` |
| Source baseline commit | `5996324dc523af57008c7f83accd08688f42c5c2` |
| Operations | 126 |
| Schemas | 288 |
| Compatibility vs 2.0.2-contract | PASS; 0 unapproved blockers |
| Enabled operations | 109 |
| Intentionally disabled | 17 |
| Not implemented | 0 |

The 17 disabled operations remain real authenticated routes that fail closed. This release changes staging secret delivery and Tencent Cloud adapters only; the client-visible API surface is unchanged. Clients should update their pinned contract version and SHA-256 after the published Release assets are verified, without changing request or response models.
