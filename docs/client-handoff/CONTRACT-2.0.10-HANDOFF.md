# BNBU Sports Contract 2.0.10 Release Handoff

| Item | Value |
| --- | --- |
| Canonical OpenAPI | `docs/backend-contracts/openapi.yaml` |
| Contract version | `2.0.10-contract` |
| Release state | `published` |
| OpenAPI version | `3.1.0` |
| SHA-256 | `56f7f13cdd8122dae630fec93bf198f7ed6d92a5fc4f67ae4f866a3b41c38ad7` |
| Source baseline commit | `aa1e12b2d0027d96bce208a845e2f96ec02c7ec2` |
| Operations | 126 |
| Schemas | 288 |
| Compatibility vs 2.0.9-contract | PASS; 0 unapproved blockers |
| Enabled operations | 109 |
| Intentionally disabled | 17 |
| Not implemented | 0 |

The 17 disabled operations remain real authenticated routes that fail closed. This release adds a staging-only business closure operator and container hardening without changing the client-visible API surface or database Migration chain. The monorepo Android/Web snapshots are pinned to the release state shown above for byte-identical integration gates; downstream developers must verify the GitHub Release assets and SHA-256 before distributing client artifacts. No request or response model changes are required.
