# BNBU Sports Contract 2.0.9 Release Handoff

| Item | Value |
| --- | --- |
| Canonical OpenAPI | `docs/backend-contracts/openapi.yaml` |
| Contract version | `2.0.9-contract` |
| Release state | `published` |
| OpenAPI version | `3.1.0` |
| SHA-256 | `2fbad60b72bf4fee6009bb5dad56351b256c2ba80aa7263bec6fe61cfd6298ca` |
| Source baseline commit | `84a49a94dcb261141d251891394327e8e321632e` |
| Operations | 126 |
| Schemas | 288 |
| Compatibility vs 2.0.8-contract | PASS; 0 unapproved blockers |
| Enabled operations | 109 |
| Intentionally disabled | 17 |
| Not implemented | 0 |

The 17 disabled operations remain real authenticated routes that fail closed. This release fixes the closed AuditLog catalog used by the isolated staging health bootstrap and adds one forward-only database constraint expansion; the client-visible API surface is unchanged. Clients should update their pinned contract version and SHA-256 after the published Release assets are verified, without changing request or response models.
