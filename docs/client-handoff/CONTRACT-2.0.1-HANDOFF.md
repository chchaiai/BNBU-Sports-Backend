# BNBU Sports Contract 2.0.1 Release Handoff

| Item | Value |
| --- | --- |
| Canonical OpenAPI | `docs/backend-contracts/openapi.yaml` |
| Contract version | `2.0.1-contract` |
| Release state | `published` |
| OpenAPI version | `3.1.0` |
| SHA-256 | `061a61f9f542a61878474b7d658e1f07060a0a715f26963d4c6c60421e827141` |
| Source baseline commit | `4a0eac17fa01aaeb928e26722d6cb632edaac26a` |
| Operations | 126 |
| Schemas | 288 |
| Compatibility vs 2.0.0-contract | PASS; 0 unapproved blockers |
| Enabled operations | 109 |
| Intentionally disabled | 17 |
| Not implemented | 0 |

The 17 disabled operations remain real authenticated routes that fail closed. This handoff authorizes neither location collection nor GPS permission requests. It adds original-byte WebM verification, not transcoding. Clients must retain photo evidence as a supported path and surface stable media validation errors. Updated clients use `GET /api/v1/exemption-application-details` for lossless exemption subtype and organization fields; QR join still completes email verification before the restricted session becomes active.
