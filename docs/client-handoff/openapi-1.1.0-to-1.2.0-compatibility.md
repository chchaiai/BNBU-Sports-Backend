# OpenAPI compatibility report: 1.1.0-contract to 1.2.0-contract

Result: **COMPATIBLE** for the structural checks listed below.

| Source | Version | SHA-256 | Paths | Operations | Schemas |
| --- | --- | --- | ---: | ---: | ---: |
| Baseline | `1.1.0-contract` | `fb040b671e3f25c48279ad6b173ced5f633de1b1a1a9db0cc0f23a11e3fde4d1` | 104 | 122 | 271 |
| Current | `1.2.0-contract` | `f194eb01c6386882220c72c5256c1ef60d09a4bf624a65d23b03ed6dd233cb4c` | 104 | 122 | 271 |

## Surface comparison

| Surface | Removed | Added |
| --- | ---: | ---: |
| paths | 0 | 0 |
| operations | 0 | 0 |
| schemas | 0 | 0 |
| properties | 0 | 0 |
| requiredMembers | 0 | 0 |
| enumValues | 0 | 5 |

## Removed contract surface

None.

## Added enum values

- `components.schemas.AppReleasePolicy#/properties/platform`: `"IOS"`
- `components.schemas.CreateFeedbackRequest#/properties/clientContext/properties/platform`: `"IOS"`
- `GET /app-release-policy parameter query:platform`: `"IOS"`
- `components.schemas.PushDevice#/properties/platform`: `"IOS"`
- `components.schemas.PushDeviceRegistrationRequest#/properties/platform`: `"IOS"`

## Scope and limits

This deterministic check detects removed paths, HTTP methods, component schemas, recursively nested schema properties, required members, and enum values. It also records additions to those surfaces. It does not prove runtime behavior, authorization behavior, persistence behavior, semantic compatibility beyond those structural checks, deployment, live Staging availability, or iOS binary compatibility.
