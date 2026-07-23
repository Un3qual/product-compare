# Affiliate Resolver Decomposition

## Snapshot

- Status: ready
- Priority: P3
- Dispatch source of truth: `docs/work/index.md`
- Plan:
  `docs/superpowers/plans/2026-07-23-affiliate-resolver-decomposition-implementation-plan.md`
- Last verified: 2026-07-23 against direct Affiliate and GraphQL workflow
  characterization paths.

## Target Outcome

`AffiliateResolver` remains schema-facing while active-coupon reads and
operator mutations live in focused owners with unchanged callback behavior.

## Ready Evidence

- The 310-line resolver combines public/nested reads, operator reads, and four
  mutation workflows.
- Existing Affiliate suites characterize authorization, Global IDs,
  Dataloader paths, payloads, and errors.

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
