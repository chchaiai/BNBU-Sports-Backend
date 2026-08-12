# BNBU Sports Contract 1.4.0 Published Handoff

| Item | Value |
| --- | --- |
| Canonical OpenAPI | `docs/backend-contracts/openapi.yaml` |
| Contract version | `1.4.0-contract` |
| Release state | `PUBLISHED` |
| OpenAPI version | `3.1.0` |
| SHA-256 | `c5d18c4894bbe421074cba27da3b39a9076328c499cc742b273665994c29059b` |
| Source commit containing the canonical contract | `d368aea5671f7507ca7b1cf61bfa05173855db68` |
| Operations | 122 |
| Schemas | 275 |
| Compatibility vs 1.3 | PASS; 0 unapproved blockers |
| Enabled operations | 104 |
| Intentionally disabled | 18 |
| Not implemented | 0 |

The 18 disabled operations remain real authenticated routes that fail closed; this handoff does not authorize Export, profile mutation, location collection, or other unapproved capabilities. Client source code was not changed by this contract release.
