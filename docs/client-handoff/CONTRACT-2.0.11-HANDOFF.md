# BNBU Sports Contract 2.0.11 Release Handoff

| Item | Value |
| --- | --- |
| Canonical OpenAPI | `docs/backend-contracts/openapi.yaml` |
| Contract version | `2.0.11-contract` |
| Release state | `published` |
| OpenAPI version | `3.1.0` |
| SHA-256 | `c3bdba5999404ea5c58b48407f582ed7b6f19fe955b793f5dfba78303ae9edb1` |
| Source baseline commit | `026d3d1d1c959e33f7450bd2ec123622c83bc9fe` |
| Operations | 126 |
| Schemas | 288 |
| Compatibility vs 2.0.10-contract | PASS; 0 unapproved blockers |
| Enabled operations | 109 |
| Intentionally disabled | 17 |
| Not implemented | 0 |

The 17 disabled operations remain real authenticated routes that fail closed. This PATCH corrects staging-only operator evidence and the Nginx request-ID runtime policy without changing the client-visible API surface or database Migration chain. The monorepo Android/Web snapshots are pinned to this published release for byte-identical integration gates; downstream developers must still verify the GitHub Release assets and SHA-256 before distributing client artifacts. No request or response model changes are required.
