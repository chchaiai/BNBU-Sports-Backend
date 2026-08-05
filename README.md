# BNBU Sports Backend

This repository is the backend-only publication mirror of the authoritative
BNBU Sports monorepo. It intentionally excludes Android and Web source code
while preserving the monorepo-relative backend, contract, tooling, CI, and
Docker paths.

The first publication baseline was exported from source commit
`c1543734c3ec12a19c972757a4ffbee4f33c28a5`.

## Layout

- `backend/`: NestJS/TypeScript application, Prisma schema and migrations,
  tests, generated contract artifacts, and runtime coverage manifest.
- `docs/backend-contracts/`: authoritative OpenAPI and backend business
  contracts.
- `tools/backend-contracts/`: contract validation tooling.

Run commands from the repository root, for example:

```powershell
npm --prefix backend ci
npm --prefix tools/backend-contracts ci
npm --prefix backend run contract:check
npm --prefix backend test
```
