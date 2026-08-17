# BNBU Sports Contract 2.0.0 Release Handoff

| Item | Value |
| --- | --- |
| Canonical OpenAPI | `docs/backend-contracts/openapi.yaml` |
| Contract version | `2.0.0-contract` |
| Release state | `published` |
| OpenAPI version | `3.1.0` |
| SHA-256 | `0e350cecf84a615dea53346ceff0a221de449976ce3d28be4cb84ba6aa3a4dd9` |
| Source baseline commit | `116e6adb3bd6c5963c9428ee3a11e1eee9e04cb1` |
| Operations | 126 |
| Schemas | 288 |
| Compatibility vs 1.4.0-contract | PASS; 0 unapproved blockers |
| Enabled operations | 109 |
| Intentionally disabled | 17 |
| Not implemented | 0 |

The 17 disabled operations remain real authenticated routes that fail closed. This handoff authorizes neither location collection nor GPS permission requests. It adds original-byte WebM verification, not transcoding. Clients must retain photo evidence as a supported path and surface stable media validation errors. Updated clients use `GET /api/v1/exemption-application-details` for lossless exemption subtype and organization fields; QR join still completes email verification before the restricted session becomes active.
