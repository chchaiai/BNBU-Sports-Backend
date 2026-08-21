# BNBU Sports Contract 2.0.12 Release Handoff

| Item | Value |
| --- | --- |
| Canonical OpenAPI | `docs/backend-contracts/openapi.yaml` |
| Contract version | `2.0.12-contract` |
| Release state | `published` |
| OpenAPI version | `3.1.0` |
| SHA-256 | `916461bed7c2fd14f28f0d750b7f414fd12f31db1ade09dc52777208fc3790d6` |
| Source baseline commit | `776e30419e522a873534d5bafba94797616c5021` |
| Operations | 126 |
| Schemas | 288 |
| Compatibility vs 2.0.11-contract | PASS; 0 unapproved blockers |
| Enabled operations | 109 |
| Intentionally disabled | 17 |
| Not implemented | 0 |

The 17 disabled operations remain real authenticated routes that fail closed. This PATCH adds only the secret-isolated Staging R01 provisioning operator and its hardened one-shot Compose boundary; it does not change the client-visible API surface or database Migration chain. The provisioner creates only the Admin/Teacher and non-login approval identities, while every Student must enter through the existing QR join and contact-binding flow. The actual Staging organization code is `BNBU`, while `R01-TEST-ORG` is only a documentation alias. The monorepo Android/Web snapshots are pinned to this published release for byte-identical integration gates; downstream developers must still verify the GitHub Release assets and SHA-256 before distributing client artifacts. No request or response model changes are required.
