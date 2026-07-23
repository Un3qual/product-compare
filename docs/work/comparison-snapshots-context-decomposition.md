# Comparison Snapshots Context Decomposition

## Snapshot

- Status: active
- Priority: P3
- Dispatch source of truth: `docs/work/index.md`
- Plan: `docs/superpowers/plans/2026-07-22-comparison-snapshots-context-decomposition-implementation-plan.md`
- Last verified: 2026-07-22 against the direct Comparison Snapshots and
  GraphQL characterization suites.
- Claimed: 2026-07-23 on the current detached worktree after the coordinator
  validated CJ Runs task decomposition as a fourth path-disjoint ready row.

## Target Outcome

`ProductCompare.ComparisonSnapshots` remains the stable application-facing
context while snapshot lifecycle, immutable evidence capture, and payload
hydration move into focused internal modules with unchanged public APIs,
queries, owner scope, payloads, errors, SEO qualification, and GraphQL values.

## Ready Evidence

- `lib/product_compare/comparison_snapshots.ex` is 444 lines and owns three
  distinct implementation responsibilities.
- Resolvers, loaders, SEO, and tests already use the stable facade, so the
  extraction does not require application caller changes.
- The selected two-suite characterization gate passed 12 tests on 2026-07-22.
- Lifecycle, capture, and payload hydration share one immutable-snapshot
  acceptance boundary and remain internal slices rather than micro-batches.
- The row is path-disjoint from SEO, Alerts, and Catalog decomposition.

## Internal Slices

1. Owner-scoped publication, public reads, active queries, and revocation.
2. Immutable product, specification, offer, merchant, and recommendation fact
   capture.
3. Stored payload hydration and domain-value decoding.

## Boundaries

- Preserve every public function, clause, guard, default, typespec, value,
  query, payload shape, and error.
- Preserve token validation and entropy, owner scope, ordering, revocation,
  evidence values, excerpt bounds, decimals, timestamps, hydration, and SEO
  qualification.
- Keep callers dependent only on `ProductCompare.ComparisonSnapshots`.
- Do not change schemas, migrations, GraphQL SDL, SEO, pricing,
  recommendations, frontend contracts, privacy, or snapshot versioning.

## Verification

- `mix test test/product_compare/comparison_snapshots_test.exs test/product_compare_web/graphql/comparison_snapshots_test.exs`
- `mix typecheck`
- `mix format --check-formatted`
- `mix work_queue.validate`
- `mix ci`
- `git diff --check`
