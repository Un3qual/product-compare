# Comparison Snapshots Context Decomposition

## Snapshot

- Status: complete
- Priority: P3
- Dispatch source of truth: `docs/work/index.md`
- Plan: `docs/superpowers/plans/2026-07-22-comparison-snapshots-context-decomposition-implementation-plan.md`
- Last verified: 2026-07-23 against the direct characterization suites, full
  repository CI, type, format, queue, caller-boundary, and diff gates.

## Batch Outcome

`ProductCompare.ComparisonSnapshots` remains the stable application-facing
context while snapshot lifecycle, immutable evidence capture, and payload
hydration now live in focused internal modules with unchanged public APIs,
queries, owner scope, payloads, errors, SEO qualification, and GraphQL values.

## Completion Evidence

- `ProductCompare.ComparisonSnapshots` remains the only application-facing
  boundary and is now a 42-line facade preserving every public function,
  clause, guard, default, typespec, value, and error.
- `ProductCompare.ComparisonSnapshots.Lifecycle` (133 lines) owns publication,
  validation, public reads, owner-scoped active queries, revocation, and
  persistence mapping.
- `ProductCompare.ComparisonSnapshots.Capture` (183 lines) owns ordered product
  loading and immutable product, specification, offer, merchant, and
  recommendation evidence projection.
- `ProductCompare.ComparisonSnapshots.PayloadCodec` (136 lines) owns persisted
  payload hydration, Decimal and DateTime restoration, and recommendation
  result decoding.
- The facade retains `hydrate/1`; the unused internal
  `Lifecycle.hydrate/1` forwarding API identified in final review was removed.
- Post-review hardening makes legacy and partial recommendation payloads with
  absent optional fields hydrate to explicit `nil` values without changing
  newly published version-1 payloads.
- The application caller scan found zero direct references to the three
  internal owners outside the facade and internal implementation paths.
- The exact direct and GraphQL characterization command passed 14 tests with
  zero failures.
- The full contract and repository gate passed without changing schemas,
  migrations, GraphQL SDL, SEO, pricing, recommendation, privacy, frontend, or
  snapshot-version policy.

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
  passed 14 tests with zero failures.
- `mix typecheck` passed.
- `mix format --check-formatted` passed.
- `mix work_queue.validate` passed with three ready rows.
- `mix ci` passed: queue, formatting, typecheck, Credo, Reach, ExDNA at the
  unchanged 6/6 budget, Dialyzer, backend and frontend tests, Relay,
  TypeScript, client and SSR builds, and the bundle contract all completed
  successfully.
- `rg -n "ProductCompare\.ComparisonSnapshots\.(Lifecycle|Capture|PayloadCodec)" lib test --glob '!lib/product_compare/comparison_snapshots.ex' --glob '!lib/product_compare/comparison_snapshots/**'`
  returned zero external caller matches.
- `git diff --check` passed.

## Remaining Work

None in this lane. Taxonomy, CJ Import Task Decomposition, and CJ Runs Task
Decomposition remain ready in the live queue.
