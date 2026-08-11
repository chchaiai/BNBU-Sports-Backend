# Contract 1.4.0 Post-Merge Release Checklist

This pull request prepares artifacts only. Do not create a tag or GitHub Release before merge.

1. On the merged default branch, run `npm --prefix backend run repo-layout:check`.
2. Run `npm --prefix tools/backend-contracts run contract:release:check` and the full backend CI workflow.
3. Confirm `docs/backend-contracts/openapi.yaml` still hashes to `de0640c26925d74b6c958ecbb905afe2a9f23bedfd396f9deaf704f070eb5ebe`.
4. Copy the candidate snapshot into `docs/backend-contracts/contract-history/1.4.0-contract-de0640c26925d74b6c958ecbb905afe2a9f23bedfd396f9deaf704f070eb5ebe/` with its manifest in a dedicated post-merge release commit.
5. Update the current-baseline pointer only in that release commit.
6. Create the approved Git tag and GitHub Release from the verified merged commit; attach the manifest, OpenAPI snapshot, compatibility reports, changelog, migration notes, and client handoff.
7. If any hash or gate differs, stop and forward-fix; never overwrite a historical snapshot.
