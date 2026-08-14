# BNBU Sports Contract 1.5.0 Candidate Handoff

| Item | Value |
| --- | --- |
| Canonical OpenAPI | `docs/backend-contracts/openapi.yaml` |
| Candidate version | `1.5.0-contract` |
| OpenAPI version | `3.1.0` |
| SHA-256 | `df64a01ce2880f949e276c1d5befbd111e0162b4b74218480f635f139eff9ba7` |
| Source baseline commit | `78276a18a9bbbc53ec3073cd1be07a85e55b0128` |
| Operations | 126 |
| Schemas | 288 |
| Compatibility vs 1.4 | PASS; 0 unapproved blockers |
| Enabled operations | 109 |
| Intentionally disabled | 17 |
| Not implemented | 0 |

The 17 disabled operations remain real authenticated routes that fail closed. This handoff authorizes neither location collection nor GPS permission requests. It adds original-byte WebM verification, not transcoding. Clients must retain photo evidence as a supported path and surface stable media validation errors. Updated clients use `GET /api/v1/exemption-application-details` for lossless exemption subtype and organization fields; QR join still completes email verification before the restricted session becomes active.
