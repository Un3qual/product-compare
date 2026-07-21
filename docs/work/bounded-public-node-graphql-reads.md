# Bounded Public Node GraphQL Reads

## Snapshot

- Status: active on `codex/bounded-graphql-read-budgets`
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
