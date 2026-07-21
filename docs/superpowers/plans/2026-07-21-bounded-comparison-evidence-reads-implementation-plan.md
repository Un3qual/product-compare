# Bounded Comparison Evidence Reads Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> `superpowers:subagent-driven-development` (recommended) or
> `superpowers:executing-plans` to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep live recommendation and immutable snapshot evidence-query
budgets fixed as a valid comparison grows from two products to three.

**Architecture:** Recommendations will consume the existing set-based current
offer-truth API instead of resolving one product at a time. Snapshot capture
will gather accepted attributes, current offer truth, and merchants for every
selected product in set-based phases at one shared timestamp, then project the
existing ordered immutable payload from those maps.

**Tech Stack:** Elixir, Ecto, Absinthe, PostgreSQL, ExUnit.

## Global Constraints

- Preserve the two-or-three distinct existing-product boundary and requested
  product order.
- Preserve recommendation profiles, algorithm versions, winner/tie/insufficient
  semantics, currency rules, ranking order, and exact evidence IDs.
- Preserve snapshot tokens, immutability, owner privacy, qualification flags,
  captured payload shape, product order, and revocation behavior.
- Use one shared observation timestamp per recommendation or snapshot capture.
- Keep the public GraphQL schema unchanged.
- Use behavior/query-budget tests and verify RED before production changes.

---

### Task 1: Set-Based Live Recommendation Evidence

**Files:**

- Modify: `lib/product_compare/recommendations.ex`
- Modify: `test/product_compare/recommendations_test.exs`
- Modify: `test/product_compare_web/graphql/recommendations_test.exs`

**Interfaces:** `Recommendations.compare/3` keeps its public signature and
result contract, but loads current offer truth once for every selected product
through `Pricing.current_offer_truths/2` and then ranks from that keyed map.

- [ ] Add a failing query-budget regression comparing two and three products
  with complete same-currency offer evidence and accepted claims.
- [ ] Assert complete result parity before asserting product, claim,
  merchant-product, price-point, artifact, and source SELECT budgets.
- [ ] Confirm RED because offer truth currently executes once per product.
- [ ] Replace per-product offer reads with one set-based read at the existing
  shared `now`.
- [ ] Re-run context and GraphQL recommendation suites.
- [ ] Commit with message `perf: batch recommendation evidence reads`.

### Task 2: Set-Based Immutable Snapshot Capture

**Files:**

- Modify: `lib/product_compare/comparison_snapshots.ex`
- Modify: `test/product_compare/comparison_snapshots_test.exs`
- Modify: `test/product_compare_web/graphql/comparison_snapshots_test.exs`

**Interfaces:** Snapshot capture preloads every selected product's accepted
attributes with `Specs.list_current_attributes_for_products/1`, current offers
with `Pricing.current_offer_truths/2`, and merchants for all captured best
offers in one query. Projection helpers receive those maps rather than issuing
queries for an individual product.

- [ ] Add a failing query-budget regression comparing two- and three-product
  publications with attributes, provenance, offers, and recommendation facts.
- [ ] Assert exact ordered payload, public GraphQL values, qualification,
  privacy, token, and revocation semantics before the query budget.
- [ ] Confirm RED because attributes, offer truth, and merchant reads currently
  repeat for every selected product.
- [ ] Implement set-based evidence gathering and pure ordered payload
  projection at one shared timestamp.
- [ ] Re-run context and GraphQL snapshot suites.
- [ ] Commit with message `perf: batch comparison snapshot evidence reads`.

### Task 3: Lane Evidence And Batch Gate

**Files:**

- Modify: `docs/work/bounded-comparison-evidence-reads.md`

- [ ] Record exact before/after query counts and semantic parity coverage.
- [ ] Run `mix test test/product_compare/recommendations_test.exs
  test/product_compare/comparison_snapshots_test.exs
  test/product_compare_web/graphql/recommendations_test.exs
  test/product_compare_web/graphql/comparison_snapshots_test.exs`.
- [ ] Run `mix typecheck`, `mix format --check-formatted`,
  `mix work_queue.validate`, and `git diff --check`.
- [ ] Include lane evidence in the final code/test milestone commit.
