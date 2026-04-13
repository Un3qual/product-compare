# Repository Guidance

## Execution Entry Point

- Start plan discovery at `docs/work/index.md`.
- Treat `docs/work/*.md` as the source of truth for active execution status, priority, blockers, and the next batch of work.
- Treat dated docs in `docs/plans/` and `docs/implementation-checklist.md` as historical design/checkpoint context unless `docs/work/index.md` links them as the current active work item.
- When `docs/work/index.md` lists multiple active lanes, assign exactly one lane per worker. Default lanes are `frontend` and `backend`.
- Verify the selected batch against the codebase before assuming an unchecked item is still unimplemented.
- Update the relevant `docs/work/*.md` file when batch status, blockers, or priorities change.
- In parallel mode, a worker may edit only files in its lane's `Owned paths` plus its lane work doc.
- Treat `docs/work/index.md`, `docs/plans/NOW.md`, `docs/plans/INDEX.md`, and `ARCHITECTURE.md` as coordinator-owned shared docs during parallel execution. Update them only from the coordinating session or at integration boundaries.
- If the selected batch requires another lane's files or a coordinator-owned doc, record the blocker in the lane work doc instead of crossing lanes.
- Commit only at milestone boundaries that include the related code/test/doc changes; do not make standalone checkbox-only or docs-only progress commits.

## Auth Contract

- Frontend-facing browser auth flows must use GraphQL over `/api/graphql`.
- Do not add new REST/JSON endpoints for browser `login`, `register`, `logout`, `forgotPassword`, `resetPassword`, or `verifyEmail` flows.
- Keep Phoenix as the cookie-backed session authority. GraphQL auth mutations set or clear the Phoenix session cookie; they do not return bearer or session tokens for browser auth.
- Treat `viewer` plus auth mutations on the GraphQL schema as the frontend auth contract.

## Migration Guardrail

- The repository is migrating all browser auth flows from legacy REST endpoints to GraphQL.
- For the current migration plan and phased scope, read:
  - `docs/work/graphql-auth-migration.md`
  - `docs/plans/2026-03-16-graphql-auth-migration-design.md`
  - `docs/plans/2026-03-16-graphql-auth-migration-implementation-plan.md`
- If you touch auth during this migration, update those docs when the scope or completion state changes.
