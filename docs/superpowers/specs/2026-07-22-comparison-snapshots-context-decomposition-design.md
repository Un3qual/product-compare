# Comparison Snapshots Context Decomposition Design

## Goal

Keep `ProductCompare.ComparisonSnapshots` as the stable application-facing
context while moving snapshot lifecycle, immutable fact capture, and payload
hydration into focused internal modules without changing public comparison
behavior or contracts.

## Current Boundary

The 444-line context currently owns three distinct responsibilities:

1. Owner-scoped publication, public-token reads, owner queries, and revocation.
2. Immutable product, specification, offer, merchant, and recommendation fact
   capture.
3. Stored payload decoding and hydration across atom-keyed and string-keyed
   maps.

Resolvers, GraphQL loaders, SEO, and tests already depend on the stable context
boundary, so the extraction does not require caller changes.

## Architecture

- `ProductCompare.ComparisonSnapshots.Lifecycle` owns validation, publication,
  token generation, public and owner-scoped reads, revocation, and persistence.
- `ProductCompare.ComparisonSnapshots.Capture` owns ordered product loading and
  immutable evidence capture from Specs, Pricing, Recommendations, and merchant
  records.
- `ProductCompare.ComparisonSnapshots.PayloadCodec` owns hydration and payload
  decoding, including Decimal and DateTime restoration.
- `ProductCompare.ComparisonSnapshots` retains every existing public function,
  clause, guard, default, typespec, return value, and explicit wrapper.

Internal owners may collaborate directly, but application callers continue to
depend only on the facade.

## Preserved Behavior

- Two-or-three unique positive product validation, supported profiles, ordered
  product capture, title normalization, and 256-bit URL-safe public tokens.
- Atomic snapshot insertion, search qualification through the existing SEO
  policy, owner scope, active ordering, entropy-ID casting, stale revocation,
  and `:not_found` behavior.
- Revoked and malformed tokens remain absent; batched public reads preserve
  input-key projection and hydration.
- Captured product, attribute, evidence, offer, merchant, and recommendation
  fields retain their current values, ordering, bounded excerpts, decimal
  serialization, and timestamps.
- Legacy atom-keyed and persisted string-keyed payloads hydrate to the same
  domain values and result structs.

## Errors And Transactions

The extraction preserves changeset errors and the existing
`:invalid_products`, `:product_not_found`, `:invalid_profile`, and `:not_found`
domain errors. It does not add a new transaction, retry, rescue, fallback, or
public callback boundary.

## Verification

The direct characterization gate is:

```bash
mix test \
  test/product_compare/comparison_snapshots_test.exs \
  test/product_compare_web/graphql/comparison_snapshots_test.exs
```

It currently passes 12 tests. Completion also requires `mix typecheck`,
`mix format --check-formatted`, `mix work_queue.validate`, `mix ci`,
`git diff --check`, and a caller scan proving that application code does not
bypass the facade.

## Non-Goals

- No schema, migration, GraphQL, SEO policy, recommendation policy, pricing
  policy, frontend, privacy, token, or snapshot-version changes.
- No mutable snapshot payloads or owner identity in public payloads.
- No separate queue row per internal module; all slices share one immutable
  comparison-snapshot acceptance boundary.
