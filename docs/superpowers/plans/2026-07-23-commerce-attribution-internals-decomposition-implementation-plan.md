# Commerce Attribution Internals Decomposition Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> `superpowers:subagent-driven-development` (recommended) or
> `superpowers:executing-plans` to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preserve the Commerce Attribution and GraphQL contracts while
extracting focused click, conversion, revenue, and resolver owners after the
Destination URL decomposition is complete.

**Architecture:** `Clicks`, `Conversions`, and `Revenue` remain internal
facades used only by `ProductCompare.CommerceAttribution`; each delegates to
focused workflow owners. `CommerceAttributionResolver` remains schema-facing
over revenue reads and click mutations.

**Tech Stack:** Elixir, Ecto, PostgreSQL, Decimal, URI, Absinthe, ExUnit.

## Global Constraints

- Prerequisite:
  `docs/superpowers/plans/2026-07-23-commerce-destination-url-decomposition-implementation-plan.md`
  is complete and green.
- Preserve `ProductCompare.CommerceAttribution` as the only application-facing
  context.
- Preserve all public functions, defaults, values, errors, conflicts,
  transactions, destinations, redirects, attribution dimensions, queries,
  suppression, and GraphQL payloads.
- Keep destination validation fail closed and route all acceptance through
  `DestinationUrl.valid?/1`.
- Do not change schemas, migrations, providers, GraphQL SDL, controllers,
  Relay, frontend behavior, or product policy.

---

## Task 1: Commerce Link Ownership

**Files:**

- Create: `lib/product_compare/commerce_attribution/clicks/links.ex`
- Modify: `lib/product_compare/commerce_attribution/clicks.ex`
- Test:
  `test/product_compare/commerce_attribution/commerce_attribution_test.exs`

**Interfaces:**

- Produces:
  `Links.upsert/1`,
  `Links.ensure_active/1`, and
  `Links.tracked_attrs/1`.

- [ ] Run the direct attribution suite as the green baseline.
- [ ] Add `Clicks` delegation and verify the expected missing-owner
  compilation failure.
- [ ] Move commerce-link changeset/upsert, active-link validation,
  tracked-link attribute projection, and nil-network omission into `Links`.
- [ ] Preserve conflict targets, replay values, changeset errors, and active
  status behavior.
- [ ] Re-run the suite; expect all tests to pass.
- [ ] Commit with message `refactor: isolate commerce link persistence`.

## Task 2: Trusted Click Destination Ownership

**Files:**

- Create:
  `lib/product_compare/commerce_attribution/clicks/destinations.ex`
- Modify: `lib/product_compare/commerce_attribution/clicks.ex`
- Read:
  `lib/product_compare/commerce_attribution/destination_url.ex`
- Test:
  `test/product_compare/commerce_attribution/commerce_attribution_test.exs`
- Test:
  `test/product_compare/commerce_attribution/destination_url_test.exs`

**Interfaces:**

- Produces:
  `Destinations.for_merchant_product/1` and
  `Destinations.append_public_click_id/2`.
- Returns the current trusted destination map or exact error.

- [ ] Run both named suites before extraction.
- [ ] Add facade delegation and verify the expected missing-owner failure.
- [ ] Move merchant-product lookup, affiliate fallback, browser-compatible
  normalization, affiliate program/network projection, destination choice,
  and Impact `ClickId` query handling into `Destinations`.
- [ ] Preserve unsafe URL rejection, query preservation, duplicate click-ID
  avoidance, and merchant fallback behavior.
- [ ] Re-run both suites; expect exact destination acceptance and selection.
- [ ] Commit with message `refactor: isolate commerce click destinations`.

## Task 3: Click Session And Tracking Ownership

**Files:**

- Create: `lib/product_compare/commerce_attribution/clicks/sessions.ex`
- Modify: `lib/product_compare/commerce_attribution/clicks.ex`
- Read: `lib/product_compare/commerce_attribution/clicks/links.ex`
- Read:
  `lib/product_compare/commerce_attribution/clicks/destinations.ex`
- Test:
  `test/product_compare/commerce_attribution/commerce_attribution_test.exs`
- Test: `test/product_compare_web/graphql/commerce_click_test.exs`

**Interfaces:**

- Produces:
  `Sessions.create/1` and
  `Sessions.track_outbound/1`.

- [ ] Run both named suites before extraction.
- [ ] Add facade delegation and verify the expected missing-owner failure.
- [ ] Move merchant-product ID normalization, destination resolution
  orchestration, tracked commerce-link persistence, click-session attributes,
  and session insertion into `Sessions`.
- [ ] Preserve current user attribution, accepted input fields, transaction
  boundaries, result map, and errors.
- [ ] Re-run both suites; expect exact context and GraphQL click behavior.
- [ ] Commit with message `refactor: isolate commerce click sessions`.

## Task 4: Redirect Read Ownership

**Files:**

- Create: `lib/product_compare/commerce_attribution/clicks/redirects.ex`
- Modify: `lib/product_compare/commerce_attribution/clicks.ex`
- Test:
  `test/product_compare/commerce_attribution/commerce_attribution_test.exs`
- Test:
  `test/product_compare_web/controllers/commerce_redirect_controller_test.exs`

**Interfaces:**

- Produces:
  `Redirects.destination/1`, returning the current redirect result.

- [ ] Run both named suites before extraction.
- [ ] Add facade delegation and verify the expected missing-owner failure.
- [ ] Move public click-session lookup, active-link enforcement, stored
  destination selection, and public click-ID projection into `Redirects`.
- [ ] Preserve invalid/unknown click IDs, inactive links, and controller 404
  behavior.
- [ ] Re-run both suites; expect exact redirect behavior.
- [ ] Commit with message `refactor: isolate commerce redirects`.

## Task 5: Conversion Click Attribution Ownership

**Files:**

- Create:
  `lib/product_compare/commerce_attribution/conversions/attribution.ex`
- Modify: `lib/product_compare/commerce_attribution/conversions.ex`
- Test:
  `test/product_compare/commerce_attribution/commerce_attribution_test.exs`

**Interfaces:**

- Produces:
  `Attribution.resolve/1`,
  `Attribution.restore_persisted/1`, and
  `Attribution.conflicts/3`.
- Returns the current attrs/changeset state consumed by conversion
  persistence.

- [ ] Run the direct attribution suite before extraction.
- [ ] Add delegation and verify the expected missing-owner failure.
- [ ] Move click-session resolution by ID/public ID, dimension projection,
  affiliate-program and merchant-product relationship checks, castable
  provider dimensions, persisted attribution restoration, and conflict
  changesets into `Attribution`.
- [ ] Preserve nil-dimension compatibility, every conflict field, confidence
  behavior, and relationship validation before persistence.
- [ ] Re-run the suite; expect exact conflict and valid-attribution behavior.
- [ ] Commit with message `refactor: isolate conversion attribution`.

## Task 6: Conversion Persistence Ownership

**Files:**

- Create:
  `lib/product_compare/commerce_attribution/conversions/persistence.ex`
- Modify: `lib/product_compare/commerce_attribution/conversions.ex`
- Read:
  `lib/product_compare/commerce_attribution/conversions/attribution.ex`
- Test:
  `test/product_compare/commerce_attribution/commerce_attribution_test.exs`

**Interfaces:**

- Produces:
  `Persistence.ingest/1`.

- [ ] Run the direct suite before extraction.
- [ ] Add facade delegation and verify the expected missing-owner failure.
- [ ] Move default confidence, changeset construction, attribution resolution,
  conversion upsert, conflict update fields, unchanged-row fetch, replay, and
  rollback handling into `Persistence`.
- [ ] Preserve unknown-status rejection, approved-status protection,
  insert/update semantics, stale updates, and exact returned conversion.
- [ ] Re-run the suite; expect all conversion cases to pass.
- [ ] Commit with message `refactor: isolate conversion persistence`.

## Task 7: Purchase Price Fact Ownership

**Files:**

- Create:
  `lib/product_compare/commerce_attribution/conversions/purchase_facts.ex`
- Modify: `lib/product_compare/commerce_attribution/conversions.ex`
- Test:
  `test/product_compare/commerce_attribution/commerce_attribution_test.exs`

**Interfaces:**

- Produces:
  `PurchaseFacts.create/1`.

- [ ] Run the direct suite before extraction.
- [ ] Add facade delegation and verify the expected missing-owner failure.
- [ ] Move purchase-price fact changeset creation and persistence into
  `PurchaseFacts`.
- [ ] Preserve every required attribute, validation error, and result.
- [ ] Re-run the suite; expect all tests to pass.
- [ ] Commit with message `refactor: isolate purchase price facts`.

## Task 8: Revenue Filter Ownership

**Files:**

- Create: `lib/product_compare/commerce_attribution/revenue/filters.ex`
- Modify: `lib/product_compare/commerce_attribution/revenue.ex`
- Test:
  `test/product_compare_web/graphql/commerce_revenue_summary_test.exs`

**Interfaces:**

- Produces:
  `Filters.normalize/1`,
  `Filters.for_dashboard/1`,
  `Filters.put/3`,
  `Filters.start_datetime/1`, and
  `Filters.exclusive_end_datetime/1`.

- [ ] Run the revenue GraphQL suite as the green baseline.
- [ ] Add facade delegation and verify the expected missing-owner failure.
- [ ] Move list/map option access, dates, minimum conversions, dimension IDs,
  currency, network, dashboard overrides, and UTC calendar bounds into
  `Filters`.
- [ ] Preserve accepted strings/atoms/integers, raised `ArgumentError`
  messages, normalization, and default values.
- [ ] Re-run the suite; expect exact filter error and success behavior.
- [ ] Commit with message `refactor: isolate revenue filters`.

## Task 9: Revenue Aggregation Ownership

**Files:**

- Create:
  `lib/product_compare/commerce_attribution/revenue/aggregation.ex`
- Modify: `lib/product_compare/commerce_attribution/revenue.ex`
- Read: `lib/product_compare/commerce_attribution/revenue/filters.ex`
- Test:
  `test/product_compare/commerce_attribution/commerce_attribution_test.exs`
- Test:
  `test/product_compare_web/graphql/commerce_revenue_summary_test.exs`

**Interfaces:**

- Produces:
  `Aggregation.metrics/1` and
  `Aggregation.click_count/1`.

- [ ] Run both named suites before extraction.
- [ ] Add facade delegation and verify the expected missing-owner failure.
- [ ] Move conversion/click joins, merchant/product/network/date/currency
  predicates, currency selection, mixed-currency enforcement, and aggregate
  selects into `Aggregation`.
- [ ] Preserve conditional join behavior, query semantics, click counting, and
  exact mixed-currency error.
- [ ] Re-run both suites; expect exact summaries and query behavior.
- [ ] Commit with message `refactor: isolate revenue aggregation`.

## Task 10: Revenue Projection Ownership

**Files:**

- Create:
  `lib/product_compare/commerce_attribution/revenue/projection.ex`
- Modify: `lib/product_compare/commerce_attribution/revenue.ex`
- Test:
  `test/product_compare_web/graphql/commerce_revenue_summary_test.exs`

**Interfaces:**

- Produces:
  `Projection.summary/3`, receiving normalized filters, aggregate metrics, and
  click count.

- [ ] Run the revenue suite before extraction.
- [ ] Add facade delegation and verify the expected missing-owner failure.
- [ ] Move low-volume suppression, date/network string projection, decimal
  money formatting, nullable money values, and final summary assembly into
  `Projection`.
- [ ] Preserve suppressed values, zero values, result keys, and JSON-ready
  strings.
- [ ] Re-run the suite; expect exact GraphQL summary values.
- [ ] Commit with message `refactor: isolate revenue projection`.

## Task 11: Commerce Attribution Resolver Reads

**Files:**

- Create:
  `lib/product_compare_web/resolvers/commerce_attribution/reads.ex`
- Modify:
  `lib/product_compare_web/resolvers/commerce_attribution_resolver.ex`
- Test:
  `test/product_compare_web/graphql/commerce_revenue_summary_test.exs`

**Interfaces:**

- Produces:
  `Reads.revenue_summary/3`.

- [ ] Run the revenue GraphQL suite before extraction.
- [ ] Add facade delegation and verify the expected missing-owner failure.
- [ ] Move operator authorization, revenue input normalization, context call,
  invalid-filter handling, and summary projection into resolver `Reads`.
- [ ] Preserve both callback clauses, field-level authorization order, error
  text, and result shape.
- [ ] Re-run the suite; expect all tests to pass.
- [ ] Commit with message `refactor: isolate graphql revenue reads`.

## Task 12: Commerce Attribution Resolver Mutations

**Files:**

- Create:
  `lib/product_compare_web/resolvers/commerce_attribution/mutations.ex`
- Modify:
  `lib/product_compare_web/resolvers/commerce_attribution_resolver.ex`
- Test: `test/product_compare_web/graphql/commerce_click_test.exs`

**Interfaces:**

- Produces:
  `Mutations.track_commerce_click/3`.

- [ ] Run the click GraphQL suite before extraction.
- [ ] Add facade delegation and verify the expected missing-owner failure.
- [ ] Move trusted-origin validation, merchant-product Global ID decoding,
  current-user projection, context call, nil-value omission, and mutation
  payload errors into resolver `Mutations`.
- [ ] Preserve every error code/message/field and relative redirect result.
- [ ] Re-run the suite; expect all tests to pass.
- [ ] Commit with message `refactor: isolate graphql commerce clicks`.

## Task 13: Full Commerce Attribution Gate

**Files:**

- Modify: `docs/work/commerce-attribution-internals-decomposition.md`

- [ ] Run
  `mix test test/product_compare/commerce_attribution
  test/product_compare_web/controllers/commerce_redirect_controller_test.exs
  test/product_compare_web/graphql/commerce_click_test.exs
  test/product_compare_web/graphql/commerce_revenue_summary_test.exs`.
- [ ] Run `mix typecheck`, `mix format --check-formatted`,
  `mix work_queue.validate`, `mix ci`, and `git diff --check`.
- [ ] Confirm no caller bypasses `ProductCompare.CommerceAttribution`, no
  schema field bypasses `CommerceAttributionResolver`, and focused owners are
  contained in their namespaces.
- [ ] Record final owner sizes, exact test counts, and gate evidence.
- [ ] Include the lane doc in the final commerce-attribution milestone commit.
