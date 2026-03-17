# Repository Guidance

## Auth Contract

- Frontend-facing browser auth flows must use GraphQL over `/api/graphql`.
- Do not add new REST/JSON endpoints for browser `login`, `register`, `logout`, `forgotPassword`, `resetPassword`, or `verifyEmail` flows.
- Keep Phoenix as the cookie-backed session authority. GraphQL auth mutations set or clear the Phoenix session cookie; they do not return bearer or session tokens for browser auth.
- Treat `viewer` plus auth mutations on the GraphQL schema as the frontend auth contract.

## Migration Guardrail

- The repository is migrating all browser auth flows from legacy REST endpoints to GraphQL.
- For the current migration plan and phased scope, read:
  - `docs/plans/2026-03-16-graphql-auth-migration-design.md`
  - `docs/plans/2026-03-16-graphql-auth-migration-implementation-plan.md`
- If you touch auth during this migration, update those docs when the scope or completion state changes.

## Execution Workflow

- `docs/NEXT.md` is the source of truth for the next meaningful batch of work.
- Start with `docs/NEXT.md` before scanning `docs/plans/` or other historical docs.
- Read only the docs referenced by the selected `docs/NEXT.md` task unless `docs/NEXT.md` is missing, stale, or contradictory.
- Treat `docs/plans/` and `docs/implementation-checklist.md` as supporting context and historical records, not the default task queue.
- Keep batches to one full task section or 3-5 related steps when safe.
- Commit at milestone boundaries: completed task section, user-visible behavior change, or explicit verification checkpoint.
- Do not make standalone checklist-only or docs-only progress commits; bundle status updates with the related code/test change.
- When a batch lands, update `docs/NEXT.md` and the referenced plan/design docs in the same milestone commit.
