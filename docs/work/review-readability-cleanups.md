# Review Readability Cleanups

## Snapshot

- Status: completed
- Priority: P2
- Source of truth: this file
- Last verified: 2026-05-31 after full frontend/backend verification
- Historical context:
  - `ARCHITECTURE.md`
  - `docs/work/frontend-saved-comparisons-relay-migration.md`
  - `docs/work/graphql-relay-contract-hardening.md`
  - `docs/work/graphql-auth-migration.md`
- Objective: record the consolidated frontend and backend cleanup work completed on the review branch without keeping per-helper checkpoint files.

## Completed Scope

### Frontend Relay And Route Helpers

- Completed `/compare/saved` migration from manual delete helper calls to Relay mutation commits.
- Added shared frontend route helpers for form string extraction, loader recovery and thrown-error normalization, Relay mutation promise handling, route mutation error normalization, GraphQL error presence checks, and route payload guards.
- Routed browser auth, catalog/product loaders, compare save/delete flows, and saved-comparison route data parsing through the shared helpers while preserving existing route behavior.

### Backend GraphQL Helpers

- Centralized GraphQL input lookup, optional/take/drop/put helpers, numeric/boolean normalization, Relay global ID decode/encode helpers, connection arg/result helpers, mutation error helpers, and unauthenticated mutation errors.
- Routed Auth, Catalog, Pricing, Affiliate, Commerce Attribution, Node, and schema field resolver paths through the shared helpers.
- Extended root node lookup coverage for authenticated affiliate entities and public price points while keeping `SourceArtifact` unsupported until a public object contract exists.

### Core Backend Attr Handling

- Kept Accounts, Affiliate, and Commerce Attribution attr normalization local to the contexts that use it, including explicit nil API-token expiry handling and atom/string-key filter support.

### Queue And Planning Docs

- Updated `docs/work/index.md`, `docs/plans/NOW.md`, `docs/plans/INDEX.md`, `ARCHITECTURE.md`, and affected lane docs to show the saved-comparisons Relay migration and review cleanup batches as completed.
- Kept product data ingestion blocked on live CJ credential access, quota behavior, account-scoped samples, and source onboarding compliance signoff.

## Verification

- `cd assets && bun run check` - 204 tests passed.
- `mix test` - 329 tests passed.
- `mix format --check-formatted`
- `mix compile --warnings-as-errors`
- `mix typecheck`
- `git diff --check`
