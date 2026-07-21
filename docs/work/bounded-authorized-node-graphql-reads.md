# Bounded Authorized Node GraphQL Reads

## Snapshot

- Status: complete
- Completed on: `codex/bounded-public-opaque-graphql-reads`
- Priority: P2
- Dispatch source of truth: `docs/work/index.md`
- Plan: `docs/superpowers/plans/2026-07-21-bounded-authorized-node-graphql-reads-implementation-plan.md`
- Last verified: 2026-07-21 against the Relay node resolver, Affiliate,
  Accounts, and Catalog lookup contexts, node authorization coverage, and the
  completed public-node Dataloader pattern.

## Batch Outcome

Operator-only and owner-scoped Relay `node(id:)` aliases keep a fixed SELECT
budget per node type as authorized alias count grows, without changing
authorization, ownership, privacy, missing/error behavior, nested values, or
Relay identity.

## Completion Evidence

- Public Product, Brand, Merchant, MerchantProduct, PricePoint, and
  SourceArtifact node types already use request-scoped Dataloader reads.
- AffiliateNetwork, AffiliateProgram, AffiliateLink, Coupon,
  SavedComparisonSet, and ApiToken now resolve through one authorization-aware
  request source after operator or owner validation.
- The set-based context APIs retain explicit `nil` values for missing or
  cross-owner keys, and saved-set associations remain intentionally lazy.
- Existing and new coverage proves operator authorization, anonymous and
  cross-owner privacy, malformed IDs, missing nodes, nested saved-set items,
  exact values, and fixed growing-alias budgets.

## Internal Slices

1. Set-based operator-only affiliate node lookups.
2. Set-based owner-filtered saved-set and API-token lookups that preserve lazy
   associations.
3. Authorization-aware request-scoped loading plus semantic, privacy, and
   fixed-budget coverage.

## Delivered

- The operator-node context slice is green: Affiliate now returns an explicit
  record-or-`nil` map for empty, duplicate, missing, two-ID, and four-ID
  requests across all four schemas with exactly one SELECT per non-empty type.
- The owner-context slice is green: Accounts and Catalog validate and dedupe
  requested UUIDs, retain missing and cross-owner `nil` entries, keep saved-set
  associations lazy, perform no query for an empty request, and hold at one
  SELECT from two IDs through four.
- UUID request validation and missing-result projection live in one shared
  `ProductCompare.Input` contract, so Accounts and Catalog retain only their
  owner-filtered queries. Its 20-test suite covers deduplication, valid/missing/
  invalid projection, and the zero-load empty/invalid boundary.
- The focused Affiliate, Accounts, and Catalog suites pass 32 tests.
- The authorization-aware GraphQL slice is green. Before the loader, two and
  four aliases produced 2 and 4 SELECTs for program/link/coupon, and 3 and 5
  for network/saved-set/API-token when the fixed missing-node assertion was
  included. After the loader, every entity table holds at one SELECT for both
  sizes; saved-set item and product loads also remain at one.
- Operator authorization runs before scheduling loads, owner batch keys include
  the current user ID, missing nodes remain `nil`, nested saved-set items retain
  their exact order and product values, and anonymous aliases issue zero
  tracked entity or nested SELECTs.
- All five focused suites pass 68 tests. `mix typecheck` and
  `mix format --check-formatted` also pass. The final `mix ci` gate validates
  the three-row queue, holds ExDNA at its 6/6 clone budget, passes Dialyzer,
  passes 851 backend tests at 83.60% coverage and 1,507 frontend tests, and
  completes Relay, TypeScript, client/SSR build, and bundle-budget checks.

## Boundaries

- Authorize operator node types before scheduling a database read.
- Include the current user ID in owner-scoped batch keys and preserve anonymous
  zero-query `nil` behavior.
- Preserve missing, malformed, forbidden, cross-owner, lazy association,
  field-value, and Relay type behavior.
- Do not change the public GraphQL schema.

## Verification

- Affiliate, Accounts, Catalog, node, and growing-alias Dataloader tests.
- Shared input normalization tests.
- `mix typecheck`
- `mix format --check-formatted`
- `mix work_queue.validate`
- `git diff --check`
