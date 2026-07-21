# Bounded Comparison Evidence Reads

## Snapshot

- Status: complete on `codex/bounded-public-opaque-graphql-reads`
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

## Initial Evidence

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

## Implementation Evidence

- Recommendation RED grew merchant-product and price-point SELECTs from two to
  three as selection grew from two products to three. GREEN holds products,
  current claims, merchant products, and price points at one SELECT each for
  both selection sizes.
- Exact recommendation ranking order, winner, price-point IDs, reasons, and
  public GraphQL values remain green.
- Snapshot RED grew products `4 -> 5`, merchant products `6 -> 9`, price points
  `4 -> 6`, current attributes `3 -> 4`, merchants `2 -> 3`, accepted claims
  `2 -> 3`, and taxon attributes `2 -> 3`.
- Snapshot GREEN holds products at three, merchant products at three, price
  points at two, current attributes at two, merchants at one, accepted claims
  at one, taxon attributes at one, and snapshot hydration at one SELECT for
  both two- and three-product publications.
- Exact requested product order, accepted claim IDs, price-point IDs,
  recommendation winner, public GraphQL values, and existing snapshot lifecycle
  suites remain green.

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

## Completion Evidence

- Focused verification passed 16 recommendation and comparison-snapshot
  context/GraphQL tests with zero failures.
- `mix typecheck`, `mix format --check-formatted`, `mix work_queue.validate`,
  and `git diff --check` passed; the live queue retains three complete ready
  successors.
- `mix ci` passed 845 backend tests with 83.67% coverage, Credo with no issues,
  the 6/6 ExDNA clone budget, cross-function smell detection, Dialyzer, Relay
  validation, TypeScript, 1,507 frontend tests across 105 files, client and SSR
  builds, and the 182,164-byte gzip client-bundle budget.

## Remaining Work

None. Authorized-node GraphQL reads, alert-evaluation market reads, and
comparison-root GraphQL reads remain ready in the live queue.
