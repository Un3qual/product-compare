# Bounded Alert Evaluation Market Reads Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> `superpowers:subagent-driven-development` (recommended) or
> `superpowers:executing-plans` to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Evaluate every watch applicable to one price observation without
re-reading the same product-wide or listing-scoped market facts once per watch.

**Architecture:** One evaluation run derives the product-wide and triggering-
listing facts required by its applicable watch scopes before entering the
per-watch transaction loop. Each watch still locks and updates independently;
the locked row selects one immutable fact from the run so replay safety,
cooldowns, partial-failure reporting, and later-watch progress remain intact.

**Tech Stack:** Elixir, Ecto, PostgreSQL, Oban, ExUnit.

## Global Constraints

- Preserve one transaction and row lock per watch.
- Preserve product-wide and listing-scoped eligibility semantics.
- Preserve event and delivery-attempt uniqueness on replay.
- Preserve cooldown, edge-trigger, partial-failure, and later-watch progress.
- Preserve the existing three- and four-arity fault-injection hooks.
- Bound only shared market-fact reads; required per-watch lock and write work
  remains proportional to the number of watches.
- Use behavior/query-budget tests and verify RED before production changes.

---

### Task 1: Characterize Shared Evaluation Facts

**Files:**

- Modify: `test/product_compare/alerts/alerts_test.exs`

**Interfaces:** Capture SELECTs during a default `evaluate_price_point/2` run
and classify shared merchant-product/latest-price reads separately from the
required price-point load, applicable-watch read, and per-watch lock reads.

- [ ] Add a failing regression that grows a mixed product/listing watch set
  from two to six watches for one product, currency, and triggering listing.
- [ ] Assert identical event facts and summaries before comparing query counts.
- [ ] Confirm RED because shared merchant-product/latest-price SELECTs grow
  with the watch count while the per-watch row-lock SELECTs grow intentionally.
- [ ] Keep the existing fault-isolation and replay tests in the focused gate.

### Task 2: Precompute Market Facts Per Evaluation Run

**Files:**

- Modify: `lib/product_compare/alerts.ex`
- Modify: `test/product_compare/alerts/alerts_test.exs`

**Interfaces:** Add a private evaluation-fact snapshot keyed by `:product` and
`:listing`. Build only the scopes present in the loaded applicable watches,
using `Pricing.current_offer_truths/2` for the product fact and the triggering
merchant product plus its latest price for the listing fact. Pass the snapshot
only through the default evaluator; custom evaluators retain their current
three- and four-arity contracts.

- [ ] Build the immutable fact snapshot once after loading the applicable
  watches and before beginning independent watch transactions.
- [ ] Inside each transaction, select the snapshot fact from the locked
  watch's unchanged product/listing scope and run the existing condition,
  event, delivery, and state-update logic.
- [ ] Confirm shared market-fact SELECT counts are identical for two and six
  watches while required watch locks remain one per watch.
- [ ] Re-run edge, cooldown, stale/incomplete/out-of-stock, owner-scope,
  fault-isolation, and replay tests.
- [ ] Commit with message `perf: bound alert evaluation market reads`.

### Task 3: Lane Evidence And Batch Gate

**Files:**

- Modify: `docs/work/bounded-alert-evaluation-market-reads.md`

- [ ] Record exact before/after shared-read and required-lock counts.
- [ ] Run `mix test test/product_compare/alerts/alerts_test.exs`.
- [ ] Run `mix typecheck`, `mix format --check-formatted`,
  `mix work_queue.validate`, and `git diff --check`.
- [ ] Include lane evidence in the final code/test milestone commit.
