# Affiliate Resolver Decomposition

## Snapshot

- Status: complete
- Priority: P3
- Dispatch source of truth: `docs/work/index.md`
- Plan:
  `docs/superpowers/plans/2026-07-23-affiliate-resolver-decomposition-implementation-plan.md`
- Last verified: 2026-07-23 with 24 focused tests and the full repository gate.

## Target Outcome

`AffiliateResolver` remains schema-facing while active-coupon reads and
operator mutations live in focused owners with unchanged callback behavior.

## Completion Evidence

- `AffiliateResolver` is a 38-line schema-facing facade.
- `Resolvers.Affiliate.Reads` owns public nested and operator-scoped active
  coupon connections in 123 lines.
- `Resolvers.Affiliate.Mutations` owns the four operator mutation workflows,
  ID normalization, and payload errors in 195 lines.
- Schema files still reference only `AffiliateResolver`; the focused owners
  are used only by that facade and their own namespace.
- The exact direct/GraphQL gate passed 24 tests with 0 failures.
- Full `mix ci` passed 913 backend tests at 83.61% coverage, 1,507 frontend
  tests, and every queue, format, compile, Credo, six-clone ExDNA, Reach,
  Dialyzer, Relay, type, build, and bundle gate.

## Internal Slices

1. Public, nested, and operator-scoped coupon reads.
2. Network, program, link, and coupon mutations.
3. Stable resolver wrappers and schema-call parity.

## Boundaries

- Preserve every callback, clause, result, authorization decision, ID rule,
  connection argument, payload, and error.
- Do not change Affiliate context behavior, schemas, migrations, GraphQL SDL,
  Relay, or frontend behavior.

## Verification

- `mix test test/product_compare/affiliate test/product_compare_web/graphql/affiliate_workflows_test.exs`
- `mix typecheck`
- `mix format --check-formatted`
- `mix work_queue.validate`
- `mix ci`
- `git diff --check`
