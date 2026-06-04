# Repository Guidance

## Execution Entry Point

- Filename glossary: Now (NOW) is the legacy current-work pointer file (`docs/plans/NOW.md`); Index (INDEX) is the plan catalog file (`docs/plans/INDEX.md`).
- Start plan discovery at `docs/work/index.md`.
- Read `docs/work/operating-model.md` for the dispatch rules, prompt templates, and handoff templates.
- Treat `docs/work/index.md` as the only live dispatch queue. Execute only rows marked `ready`.
- Treat `docs/work/*.md` as lane context and lane-local status evidence, not as a second queue.
- Treat dated docs in `docs/plans/` and `docs/implementation-checklist.md` as historical design/checkpoint context unless `docs/work/index.md` links one as the active plan for a `ready` row.
- Treat `docs/plans/NOW.md` as a compatibility pointer back to `docs/work/index.md`, not as a separate ledger.
- If no `ready` row exists, do not search historical plans for work. Report or resolve the highest-ranked `needs_decision` or `blocked` row instead.
- Verify the selected batch against the codebase before assuming it is still unimplemented.
- Update the relevant `docs/work/*.md` file when lane-local batch status or blockers change.
- In parallel mode, a worker may edit only files in its row's `Target Paths` plus its lane work doc.
- Treat `docs/work/index.md`, `docs/plans/INDEX.md`, `docs/plans/NOW.md`, and `ARCHITECTURE.md` as coordinator-owned shared docs unless the selected queue row explicitly names them as `Target Paths`.
- If the selected batch requires another lane's files or a coordinator-owned doc, record the blocker in the lane work doc instead of crossing lanes.
- Commit only at milestone boundaries that include the related code/test/doc changes; do not make standalone checkbox-only or docs-only progress commits.
- A docs-only commit is acceptable when the docs/workflow system itself is the requested deliverable.

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
