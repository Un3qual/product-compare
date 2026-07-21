# Bounded Public Node GraphQL Reads

## Snapshot

- Status: complete on `codex/bounded-graphql-read-budgets`
- Priority: P2
- Dispatch source of truth: `docs/work/index.md`
- Plan: `docs/superpowers/plans/2026-07-20-bounded-public-node-graphql-reads-implementation-plan.md`
- Last verified: 2026-07-21 against the public Relay Node allowlist,
  request-scoped Dataloader sources, public node behavior tests, and current
  query-budget coverage.

## Batch Outcome

Public Relay `node(id:)` aliases batch by public schema so SELECT counts remain
fixed per type as alias count grows, while preserving identity, missing-node,
field-value, source-preload, and authorization boundaries.

## Ready Evidence

- `NodeResolver.fetch_public_node/2` currently calls one direct context lookup
  for every public root alias.
- The public allowlist covers Product, Brand, Merchant, MerchantProduct,
  PricePoint, and SourceArtifact.
- The request-scoped Catalog and Pricing Dataloader Ecto sources already cover
  those schemas; the Pricing source also retains SourceArtifact source
  preloading.
- `node_query_test.exs` characterizes every public type separately, but no test
  proves a fixed query budget as aliases grow.

## Internal Slices

1. Growing mixed-type public node alias query-budget characterization.
2. Public type-to-Dataloader mapping and asynchronous resolution.
3. Semantic parity, source-preload parity, and fixed per-schema budgets.

## Boundaries

- Preserve the public type allowlist, GraphQL schema, and global-ID errors.
- Preserve valid missing-node `nil`, field values, and SourceArtifact source
  loading.
- Keep operator and owner-scoped node behavior unchanged.
- Query counts may scale with distinct schemas, not same-schema aliases.

## Verification

- Public node behavior and growing-alias budget tests.
- `mix typecheck`
- `mix format --check-formatted`
- `mix work_queue.validate`
- `git diff --check`

## Completion Evidence

- Before batching, three aliases per public schema issued `%{products: 4,
  brands: 3, merchants: 3, merchant_products: 3, price_points: 3,
  source_artifacts: 3, sources: 3}` SELECTs; six aliases issued `%{products: 7,
  brands: 6, merchants: 6, merchant_products: 6, price_points: 6,
  source_artifacts: 6, sources: 6}`. The extra product query at both sizes is
  the stable valid-missing-node assertion.
- After batching, both request sizes issue exactly one SELECT for each public
  schema and one source-preload SELECT.
- The regression asserts exact Product, Brand, Merchant, MerchantProduct,
  PricePoint, and SourceArtifact type/ID/value projections plus valid missing
  Product `nil` behavior. The existing node suite preserves malformed and
  out-of-range ID errors, operator authorization, owner scoping, all public
  values, SourceArtifact safe metadata, and missing-node behavior.
- Focused verification passed 32 tests across `node_query_test.exs` and
  `dataloader_batching_test.exs`; typecheck, formatting, queue validation with
  three ready rows, and diff hygiene passed.
- `mix ci` passed 833 backend tests with 83.57% coverage, Credo with no issues,
  the 6/6 ExDNA clone budget, cross-function smell detection, Dialyzer, Relay
  validation, TypeScript, 1,507 frontend tests across 105 files, client and SSR
  builds, and the 182,164-byte gzip client-bundle budget.

## Remaining Work

None. Category, public slug, and public opaque-key read-budget outcomes remain
ready in the live queue.
