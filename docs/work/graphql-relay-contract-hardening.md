# GraphQL Relay Contract Hardening Work Doc

## Snapshot

- Status: active
- Priority: P2
- Source of truth: this file
- Last verified: 2026-03-22 after schema/test review
- Historical context:
  - `ARCHITECTURE.md`
  - `docs/plans/INDEX.md`
  - `docs/plans/2026-03-05-frontend-fullstack-design.md`
  - `docs/plans/2026-03-22-graphql-relay-contract-hardening-implementation-plan.md`
- Definition of done:
  - The GraphQL schema exposes a root `node(id: ID!)` lookup for the supported global-ID-backed catalog, pricing, and owner-scoped entities in this slice.
  - Invalid or unsupported node IDs fail deterministically.
  - Owner-scoped nodes do not leak records across users.
  - Focused GraphQL coverage exists for supported node lookups and auth/null behavior.
  - The backend lane lands without touching `assets/**` or reopening the active frontend work doc.

## Verified Current State

- `lib/product_compare_web/schema.ex` exposes `product`, `products`, `merchants`, `merchantProducts`, `myApiTokens`, and `mySavedComparisonSets`, and those object types already encode Relay-style global IDs.
- `lib/product_compare_web/graphql/global_id.ex` already decodes those global IDs, so the missing piece is the generic root lookup path rather than ID encoding.
- The backend GraphQL tests cover per-surface ID and cursor behavior in `catalog_queries_test.exs`, `pricing_queries_test.exs`, `api_token_auth_test.exs`, and `saved_comparisons_test.exs`, but no test exercises a generic `node(id: ID!)` query.
- `docs/work/frontend-relay-route-data.md` is active in the frontend lane and explicitly keeps schema changes out of that slice, so backend Relay-contract work needs its own lane and owned paths.

## Next Batch

- Status: ready
- Batch: Task 1 from `docs/plans/2026-03-22-graphql-relay-contract-hardening-implementation-plan.md`
- Why this batch:
  - The schema already emits global IDs on the public catalog and pricing surfaces, so a narrow root node resolver is now tractable.
  - Starting with public entity types keeps the first backend batch independent from auth/session ownership rules and from the active frontend lane.
  - This gives the backend worker a Relay-adjacent slice that stays entirely under `lib/**` and backend GraphQL tests.

## Parallel Lane Ownership

- Lane: backend
- Owned paths: `lib/product_compare/**`, `lib/product_compare_web/**`, `test/product_compare_web/graphql/**`, this file, and `docs/plans/2026-03-22-graphql-relay-contract-hardening-implementation-plan.md`
- Coordinator-owned docs: `docs/work/index.md`, `docs/plans/NOW.md`, `docs/plans/INDEX.md`, and `ARCHITECTURE.md`
- Stop and record a blocker here if this batch requires `assets/**`, frontend route files, or another lane's owned paths.

## Planned Follow-Up

- Extend the same node lookup path to the owner-scoped entities in Task 2 once the public entity path is proven out.
- Decide after this slice whether the next backend lane should extend generic node support to the remaining auth/affiliate entities or move to the next GraphQL contract hardening task.

## Verification Commands

- `sed -n '1,220p' docs/work/index.md`
- `sed -n '1,260p' docs/work/graphql-relay-contract-hardening.md`
- `sed -n '1,260p' docs/plans/2026-03-22-graphql-relay-contract-hardening-implementation-plan.md`
- `sed -n '1,240p' lib/product_compare_web/schema.ex`
- `sed -n '1,220p' lib/product_compare_web/graphql/global_id.ex`
- `rg -n 'field :node|node\\(|GlobalId.decode' lib/product_compare_web lib/product_compare test/product_compare_web/graphql`
