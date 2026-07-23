# Pricing Context Decomposition Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> `superpowers:subagent-driven-development` (recommended) or
> `superpowers:executing-plans` to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep `ProductCompare.Pricing` as the stable public context while
moving merchant, offer, price-history, and offer-truth read implementations
into focused internal modules.

**Architecture:** `ProductCompare.Pricing` remains the only caller-facing
facade and preserves every public function, arity, typespec, result, and error.
Four `ProductCompare.Pricing.*` owners receive the existing implementations by
responsibility, while `OfferTruth` remains the single-offer policy owner.

**Tech Stack:** Elixir, Ecto, PostgreSQL, Oban, ExUnit, Absinthe.

## Global Constraints

- Preserve every existing `ProductCompare.Pricing` public function, arity,
  default, guard, typespec, value, exception, and error.
- Preserve conflict targets, ordering, filters, Relay windows, transaction
  boundaries, alert enqueueing, price tie breaking, and offer-truth policy.
- Keep application callers dependent only on the facade.
- Do not change schemas, migrations, GraphQL SDL, frontend contracts,
  ingestion, alerts policy, or product behavior.
- Keep `ProductCompare.Pricing.OfferTruth` as the existing policy and
  single-offer summarization owner.

---

### Task 1: Merchant Ownership

**Files:**

- Create: `lib/product_compare/pricing/merchants.ex`
- Modify: `lib/product_compare/pricing.ex`
- Test: `test/product_compare/pricing/pricing_test.exs`
- Test: `test/product_compare/pricing/merchant_detail_test.exs`

**Interfaces:** `ProductCompare.Pricing.Merchants` owns merchant upsert,
listing, ID and slug lookups, and merchant-detail projection. The facade keeps
the existing public merchant functions with their current signatures.

- [ ] Run the two named suites as the green characterization baseline.
- [ ] Move merchant changesets, conflict behavior, reads, canonical slug
  handling, detail queries, summaries, and private helpers into `Merchants`.
- [ ] Replace the facade implementations with explicit wrappers retaining the
  existing defaults, guards, typespecs, and result shapes.
- [ ] Re-run both suites and confirm convergence, ordering, invalid IDs,
  missing slugs, offer summaries, and detail facts remain unchanged.
- [ ] Commit with message `refactor: isolate pricing merchant ownership`.

### Task 2: Offer Ownership

**Files:**

- Create: `lib/product_compare/pricing/offers.ex`
- Modify: `lib/product_compare/pricing.ex`
- Test: `test/product_compare/pricing/pricing_test.exs`
- Test: `test/product_compare_web/graphql/pricing_queries_test.exs`

**Interfaces:** `ProductCompare.Pricing.Offers` owns merchant-product upsert,
filter/query construction, list and entity reads, parent-scoped pages, and
offer preloads. The facade retains every existing offer-oriented function and
default argument.

- [ ] Run the two named suites as the green characterization baseline.
- [ ] Move offer persistence, conflict targets, active filtering,
  deterministic order, lookup, preloads, and Relay page construction into
  `Offers` without changing query semantics.
- [ ] Add explicit facade wrappers preserving all accepted option shapes,
  struct matches, defaults, and missing-record behavior.
- [ ] Re-run both suites and confirm filters, pagination, ordering, preloads,
  mutations, and GraphQL values remain unchanged.
- [ ] Commit with message `refactor: isolate pricing offer ownership`.

### Task 3: Price-History Ownership

**Files:**

- Create: `lib/product_compare/pricing/price_history.ex`
- Modify: `lib/product_compare/pricing.ex`
- Test: `test/product_compare/pricing/pricing_test.exs`
- Test: `test/product_compare_web/graphql/pricing_queries_test.exs`

**Interfaces:** `ProductCompare.Pricing.PriceHistory` owns price-point
creation, its alert-enqueue transaction, latest-price reads, range-filtered
history queries, and parent-scoped history pages. The facade retains every
current price-oriented function.

- [ ] Run the two named suites as the green characterization baseline.
- [ ] Move price-point changesets, transaction and enqueue behavior,
  latest-value tie breaking, range filters, ordering, source preloads, and page
  construction into `PriceHistory`.
- [ ] Add explicit facade wrappers preserving defaults, typespecs, result
  tuples, rollback reasons, and existing struct matches.
- [ ] Re-run both suites and confirm atomicity, idempotent observations,
  latest-price selection, history filters/order, and pages remain unchanged.
- [ ] Commit with message `refactor: isolate pricing history ownership`.

### Task 4: Offer-Truth Read Ownership

**Files:**

- Create: `lib/product_compare/pricing/truth_reads.ex`
- Modify: `lib/product_compare/pricing.ex`
- Read: `lib/product_compare/pricing/offer_truth.ex`
- Test: `test/product_compare/pricing/pricing_test.exs`
- Test: `test/product_compare_web/graphql/pricing_queries_test.exs`

**Interfaces:** `ProductCompare.Pricing.TruthReads` owns product-level
`current_offer_truth/2` and `current_offer_truths/2` aggregation. It consumes
the existing `ProductCompare.Pricing.OfferTruth` policy and summary functions;
the facade retains the public entry points.

- [ ] Run the two named suites as the green characterization baseline.
- [ ] Move active-offer selection, batch loading, latest-price association,
  shared-time handling, currency grouping, completeness, and best-offer
  aggregation into `TruthReads` while leaving `OfferTruth` behavior unchanged.
- [ ] Replace the facade implementations with explicit wrappers preserving
  defaults, input forms, empty results, and truth map shapes.
- [ ] Re-run both suites and confirm freshness, landed-price eligibility,
  shared-time semantics, mixed currencies, best offers, and empty products.
- [ ] Commit with message `refactor: isolate pricing truth-read ownership`.

### Task 5: Full Contract And Lane Gate

**Files:**

- Modify: `docs/work/pricing-context-decomposition.md`

- [ ] Run the exact 39-test characterization command recorded in the lane doc.
- [ ] Run `mix typecheck`, `mix format --check-formatted`,
  `mix work_queue.validate`, `mix ci`, and `git diff --check`.
- [ ] Confirm no application caller references `Pricing.Merchants`,
  `Pricing.Offers`, `Pricing.PriceHistory`, or `Pricing.TruthReads` directly.
- [ ] Record final ownership, facade size, exact test count, and gate results
  in the lane doc and include it in the final code/test milestone commit.
