# Commerce Attribution Context Decomposition Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> `superpowers:subagent-driven-development` (recommended) or
> `superpowers:executing-plans` to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep `ProductCompare.CommerceAttribution` as the stable public context
while moving its click/redirect, conversion, and revenue responsibilities into
focused internal modules.

**Architecture:** `ProductCompare.CommerceAttribution` remains the only
caller-facing facade and preserves every public function, default argument,
typespec, result, and exception boundary. Three
`ProductCompare.CommerceAttribution.*` modules own the current implementation
by responsibility; controllers, resolvers, adapters, and schemas do not depend
on the internal modules.

**Tech Stack:** Elixir, Ecto, PostgreSQL, ExUnit, Absinthe.

## Global Constraints

- Preserve every existing `ProductCompare.CommerceAttribution` public function
  and arity, including default-argument behavior.
- Preserve transaction boundaries, conflict targets, stale-update and replay
  behavior, destination safety/canonicalization, attribution conflict checks,
  revenue query semantics, date boundaries, suppression, values, and errors.
- Keep `ProductCompare.CommerceAttribution` as the only application-facing
  facade; controllers, resolvers, adapters, and tests must not move to internal
  modules.
- Keep `ProductCompare.CommerceAttribution.DestinationUrl` and
  `CommerceLink.valid_destination_url?/1` compatibility behavior intact.
- Do not change database schemas, migrations, GraphQL SDL, frontend behavior,
  provider policy, or deferred ingestion/operator work.

---

### Task 1: Click And Redirect Ownership

**Files:**

- Create: `lib/product_compare/commerce_attribution/clicks.ex`
- Modify: `lib/product_compare/commerce_attribution.ex`
- Test: `test/product_compare/commerce_attribution/commerce_attribution_test.exs`
- Test: `test/product_compare/commerce_attribution/destination_url_test.exs`
- Test: `test/product_compare_web/controllers/commerce_redirect_controller_test.exs`
- Test: `test/product_compare_web/graphql/commerce_click_test.exs`

**Interfaces:** `ProductCompare.CommerceAttribution.Clicks` owns commerce-link
upsert, click-session creation, tracked outbound clicks, trusted destination
selection, and redirect lookup. The facade retains exact wrappers for:

```elixir
upsert_commerce_link/1
create_click_session/1
track_outbound_click/1
redirect_destination/1
```

- [ ] Run the four named click/redirect suites as the green characterization
  baseline.
- [ ] Move the listed implementations and their private helpers into `Clicks`
  without changing transaction, conflict, URL, or persisted-attribute
  behavior.
- [ ] Replace each facade implementation with an explicit wrapper that keeps
  its existing typespec and return value.
- [ ] Re-run the four suites and confirm destination safety, fallback,
  tracking, controller, and GraphQL behavior remain unchanged.
- [ ] Commit with message `refactor: isolate commerce click ownership`.

### Task 2: Conversion Ownership

**Files:**

- Create: `lib/product_compare/commerce_attribution/conversions.ex`
- Modify: `lib/product_compare/commerce_attribution.ex`
- Test: `test/product_compare/commerce_attribution/commerce_attribution_test.exs`

**Interfaces:** `ProductCompare.CommerceAttribution.Conversions` owns conversion
ingestion, click-attribution restoration and conflict checks, idempotent/stale
upsert behavior, and purchase-price facts. The facade retains exact wrappers
for:

```elixir
ingest_conversion/1
create_purchase_price_fact/1
```

- [ ] Run the direct attribution suite as the green characterization baseline.
- [ ] Move conversion, replay, conflict, dimension, and purchase-fact
  implementations into `Conversions` without changing changesets,
  transactions, locks, or persisted values.
- [ ] Add explicit facade wrappers with the current typespecs and return
  shapes.
- [ ] Re-run the direct suite and confirm initial, replayed, stale, malformed,
  conflicting, and compatible conversion behavior remains unchanged.
- [ ] Commit with message `refactor: isolate commerce conversion ownership`.

### Task 3: Revenue Ownership

**Files:**

- Create: `lib/product_compare/commerce_attribution/revenue.ex`
- Modify: `lib/product_compare/commerce_attribution.ex`
- Test: `test/product_compare/commerce_attribution/commerce_attribution_test.exs`
- Test: `test/product_compare_web/graphql/commerce_revenue_summary_test.exs`

**Interfaces:** `ProductCompare.CommerceAttribution.Revenue` owns filter
normalization, aggregation queries, dimension/date constraints, money/string
projection, mixed-currency enforcement, and low-volume suppression. The facade
retains exact wrappers and defaults for:

```elixir
dashboard_revenue_summary/0,1
merchant_revenue_summary/1,2
product_revenue_summary/1,2
network_revenue_summary/1,2
```

- [ ] Run the direct and GraphQL revenue suites as the green characterization
  baseline.
- [ ] Move the listed summary implementations and private helpers into
  `Revenue` without changing queries, filter normalization, values, errors, or
  suppression.
- [ ] Add explicit facade wrappers that retain the current defaults, typespecs,
  and return shapes.
- [ ] Re-run both suites and confirm empty, filtered, mixed-currency,
  low-volume, direct-resolver, and GraphQL behavior remains unchanged.
- [ ] Commit with message `refactor: isolate commerce revenue ownership`.

### Task 4: Full Contract And Lane Gate

**Files:**

- Modify: `docs/work/commerce-attribution-context-decomposition.md`

- [ ] Run the exact five-suite characterization gate from the lane doc.
- [ ] Run `mix typecheck`, `mix format --check-formatted`,
  `mix work_queue.validate`, `mix ci`, and `git diff --check`.
- [ ] Record final module responsibilities, facade size, exact test counts, and
  gate results in the lane doc.
- [ ] Include the lane evidence in the final code/test milestone commit.
