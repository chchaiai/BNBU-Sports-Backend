# BNBU Sports Contract 1.4.0 Candidate Handoff

| Item | Value |
| --- | --- |
| Canonical OpenAPI | `docs/backend-contracts/openapi.yaml` |
| Candidate version | `1.4.0-contract` |
| OpenAPI version | `3.1.0` |
| SHA-256 | `d004ccb34b3e2bbf2958a34afba0cb64f820c0a1e610be1581d5ad1b3bf42ca1` |
| Source commit containing the canonical contract | `d368aea5671f7507ca7b1cf61bfa05173855db68` |
| Operations | 122 |
| Schemas | 275 |
| Compatibility vs 1.3 | PASS; 0 unapproved blockers |
| Enabled operations | 104 |
| Intentionally disabled | 18 |
| Not implemented | 0 |

The 18 disabled operations remain real authenticated routes that fail closed; this handoff does not authorize Export, profile mutation, location collection, or other unapproved capabilities. Client source code was not changed by this release preparation.
