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
