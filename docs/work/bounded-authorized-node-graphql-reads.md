# Bounded Authorized Node GraphQL Reads

## Snapshot

- Status: active
- Owner: `codex/bounded-public-opaque-graphql-reads`
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

## Ready Evidence

- Public Product, Brand, Merchant, MerchantProduct, PricePoint, and
  SourceArtifact node types already use request-scoped Dataloader reads.
- AffiliateNetwork, AffiliateProgram, AffiliateLink, and Coupon still authorize
  and then execute one direct context lookup for every alias.
- SavedComparisonSet and ApiToken still execute one owner-filtered context read
  for every authenticated alias. Saved-set associations remain intentionally
  lazy and their nested GraphQL values already use Dataloader.
- Existing node coverage already characterizes operator authorization,
  anonymous and cross-owner privacy, malformed IDs, nested saved-set items, and
  exact values, but does not prove growing authorized alias budgets.

## Internal Slices

1. Set-based operator-only affiliate node lookups.
2. Set-based owner-filtered saved-set and API-token lookups that preserve lazy
   associations.
3. Authorization-aware request-scoped loading plus semantic, privacy, and
   fixed-budget coverage.

## Progress

- The operator-node context slice is green: Affiliate now returns an explicit
  record-or-`nil` map for empty, duplicate, missing, two-ID, and four-ID
  requests across all four schemas with exactly one SELECT per non-empty type.
- The focused Affiliate, Accounts, Catalog baseline and new context regressions
  pass as part of 32 tests; owner-context and GraphQL loader milestones follow.

## Boundaries

- Authorize operator node types before scheduling a database read.
- Include the current user ID in owner-scoped batch keys and preserve anonymous
  zero-query `nil` behavior.
- Preserve missing, malformed, forbidden, cross-owner, lazy association,
  field-value, and Relay type behavior.
- Do not change the public GraphQL schema.

## Verification

- Affiliate, Accounts, Catalog, node, and growing-alias Dataloader tests.
- `mix typecheck`
- `mix format --check-formatted`
- `mix work_queue.validate`
- `git diff --check`
