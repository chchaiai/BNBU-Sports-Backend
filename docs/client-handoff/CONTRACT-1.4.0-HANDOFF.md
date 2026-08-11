# BNBU Sports Contract 1.4.0 Candidate Handoff

| Item | Value |
| --- | --- |
| Canonical OpenAPI | `docs/backend-contracts/openapi.yaml` |
| Candidate version | `1.4.0-contract` |
| OpenAPI version | `3.1.0` |
| SHA-256 | `079781c04ac201b91026df0b1d391a9abd33d50caee8a7f70b32fc4432553597` |
  | Source baseline commit | `14a2ee30d2a5dacb30d012b531456b7d29f6d9d5` |
| Operations | 123 |
| Schemas | 279 |
| Compatibility vs 1.3 | PASS; 0 unapproved blockers |
| Enabled operations | 106 |
| Intentionally disabled | 17 |
| Not implemented | 0 |

The 17 disabled operations remain real authenticated routes that fail closed; this handoff does not authorize Export, generic profile mutation, location collection, or other unapproved capabilities. Android and shared Web recovery guidance are synchronized in the same monorepo change.
