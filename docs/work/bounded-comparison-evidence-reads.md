# Bounded Comparison Evidence Reads

## Snapshot

- Status: ready
- Priority: P2
- Dispatch source of truth: `docs/work/index.md`
- Plan: `docs/superpowers/plans/2026-07-21-bounded-comparison-evidence-reads-implementation-plan.md`
- Last verified: 2026-07-21 against live recommendation and immutable snapshot
  context/GraphQL suites plus the existing set-based Specs and Pricing APIs.

## Batch Outcome

Live recommendations and immutable snapshot publication collect comparison
evidence with fixed SELECT budgets as selection grows from two products to
three, without changing ranking, captured facts, order, shared-time semantics,
qualification, privacy, token, or revocation behavior.

## Ready Evidence

- `Recommendations.compare/3` loads products and claims in sets, but calls
  `Pricing.current_offer_truth/2` once for every selected product even though
  `Pricing.current_offer_truths/2` already returns the same keyed evidence.
- `ComparisonSnapshots.capture/3` calls
  `Specs.list_current_attributes_for_product/1` and
  `Pricing.current_offer_truth/2` for every selected product, then loads the
  captured best-offer merchants separately for each product.
- These paths share the same comparison-decision evidence boundary and one
  accepted two-or-three-product lifecycle, so their query work is grouped as
  internal slices rather than separate micro-batches.
- Recommendation and snapshot context/GraphQL suites passed 13 tests on
  2026-07-21, but none proves a fixed budget from two products to three.

## Internal Slices

1. Set-based live recommendation current-offer evidence.
2. Set-based immutable snapshot attributes, offers, and merchant evidence.
3. Semantic, privacy, shared-time, and fixed-budget parity.

## Boundaries

- Preserve recommendation and snapshot public contracts, exact evidence IDs,
  selected order, and two-or-three-product validation.
- Preserve one observation timestamp, immutable capture, public owner privacy,
  SEO qualification, and revocation behavior.
- Reuse existing set-based Specs and Pricing APIs; do not create parallel
  evidence policies.
- Do not change the public GraphQL schema.

## Verification

- Recommendation and comparison-snapshot context and GraphQL suites.
- Growing-selection query-budget regressions for both surfaces.
- `mix typecheck`
- `mix format --check-formatted`
- `mix work_queue.validate`
- `git diff --check`
