# Homepage Query Scaling And Ownership Design

**Date:** 2026-08-11

**Status:** Awaiting written-spec review

## Objective

Reduce the amount of PostgreSQL work required to build the homepage workspace
and deal rails while making the pricing code easier to understand and change.
The implementation must preserve every current GraphQL, Relay, ranking,
pagination, privacy, and concurrency behavior.

The design keeps `price_points` and `commerce_click_sessions` authoritative.
It does not add range-specific summary tables, cached statistics, approximate
distinct counts, or materialized read models. Exact statistics must continue to
support arbitrary time bounds.

## Current Problem

`ProductCompare.Pricing.HomeOffers` currently owns four distinct concerns:

- selecting the latest usable state of merchant listings;
- deriving historical price facts such as first observation and median;
- choosing the winning offer for each product;
- ranking New, Trending, fallback, and signed-in For You rails.

The resulting Ecto composition is approximately 600 lines and expands into
large SQL statements. The SQL size is not itself a defect, but several parts of
the generated work are avoidable:

- candidate merchant listings are represented by repeated subqueries;
- first-seen history is joined even on rails that do not use it;
- the signed-in For You path runs a full ranking query as a preflight and then
  runs the ranking again for the requested page;
- offer-availability rules and latest-price selection are implemented in
  multiple pricing, catalog, and SEO paths;
- Trending's exact distinct-person aggregation must read actor columns from
  heap rows selected by a timestamp-only index.

The earlier homepage database remediation already bounds connection traversal,
scopes page-only facts, uses deterministic price ordering, and keeps related
reads in repeatable-read snapshots. This design retains those properties.

## Constraints

- Add no summary, rollup, cache, or materialized-view table.
- Keep all price and activity statistics exact.
- Keep time bounds explicit so later consumers can request ranges other than
  the current seven-day and 30-day windows.
- Preserve raw price points and click sessions as the authoritative records.
- Preserve the public `ProductCompare.Pricing` facade and all GraphQL schema,
  Relay node, connection, cursor, and response contracts.
- Preserve the homepage's USD-only offer policy.
- Preserve the 24-hour eligible-offer freshness rule, 72-hour New rule,
  seven-day Trending window, minimum-five distinct-person threshold, and exact
  30-day landed-price median.
- Preserve watch, saved-comparison, and current-comparison priority in that
  order.
- Preserve New-before-Trending fallback priority.
- Preserve repeatable-read consistency and the 1,000-row homepage traversal
  cap.
- Do not introduce timing, planner-cost, buffer-count, or representative-data
  performance gates.
- Do not split code into one-function wrapper modules.
- Preserve the user-owned `config/dev.exs` worktree change.

## Responsibility Boundaries

### `ProductCompare.Pricing.PriceHistory`

`PriceHistory` continues to own persisted price observations and gains the
reusable temporal relations currently embedded in `HomeOffers`:

- latest observation for a listing scope at or before an explicit timestamp;
- first observation for a listing scope at or before an explicit timestamp;
- exact landed-price median for a product scope, currency, and explicit
  inclusive `from` and `to` bounds.

The existing latest-price, history, and write APIs remain compatible.
Homepage-specific ranking and eligibility do not move into this module.

Temporal relation builders must return an empty relation for an empty scope.
They must reject invalid internal bounds rather than silently widening a query.
The implementation uses the existing deterministic latest observation order:
`observed_at DESC, id DESC`.

### `ProductCompare.Pricing.CurrentOffers`

The existing `ProductCompare.Pricing.TruthReads` module is renamed to
`ProductCompare.Pricing.CurrentOffers`. `TruthReads` is removed rather than
retained as a compatibility delegation layer.

`CurrentOffers` owns current merchant-listing state as of a timestamp:

- candidate listing scope;
- active and currency policy;
- latest price observation;
- stock and complete-shipping requirements;
- freshness;
- landed-price derivation;
- current product-level truth APIs already exposed by `Pricing`.

Candidate listing IDs are named once and reused by dependent current-state and
history relations. Catalog, SEO, and homepage pricing consume the same
eligible-offer relation with explicit policy arguments instead of independently
implementing latest-price selection.

`OfferTruth` remains the pure value-level policy module. It is not turned into
a query module.

### `ProductCompare.Pricing.HomeOffers`

`HomeOffers` remains the single homepage-specific pricing module. No new
`HomeDeals` module is introduced.

It owns:

- choosing the deterministic cheapest eligible USD listing per product;
- workspace offer summaries;
- New, Trending, fallback, and signed-in For You ranking;
- projection-driven, page-scoped `activeOfferCount` and `priceSignal` facts.

It composes `CurrentOffers` and `PriceHistory` rather than reimplementing their
relations. Each rail explicitly requests the facts it needs:

| Surface | Latest state | First seen | Exact median |
| --- | --- | --- | --- |
| Workspace winner | yes | no | page-only when selected |
| New selection | yes | yes | page-only when selected |
| Trending selection | yes | no | candidate-scoped for qualification |
| Signed-in For You | yes | no | relevance-scoped for ordering |
| Fallback New branch | yes | yes | no |
| Fallback Trending branch | yes | no | activity-scoped for qualification |

The `ProductCompare.Pricing` facade retains its existing public homepage
function names. Resolver and GraphQL modules do not reach into these internal
modules directly.

## Query Flow

### Workspace Products

The workspace remains product-first. The initial query selects only products
with current specifications and at least one eligible USD listing, ordered by
product ID and limited to the Relay page plus one lookahead row.

After selection, the resolver batch-loads specification highlights and the
winning offer only for those product IDs. The production fragment requests
`priceSignal`, so one exact median query runs for the returned page. It does not
calculate first-seen history or active-offer counts.

Catalog's eligibility `EXISTS` consumes the centralized current-offer relation.
The initial product query must remain capable of stopping at its limit instead
of globally materializing product details.

### Categories

Category shortcut selection continues to rank categories using homepage
qualification and returns the canonical qualified-product count. These remain
two reads because the counts have intentionally different policy meanings.

Both reads consume centralized current-offer truth. SEO no longer owns a
separate global latest-price implementation. Taxonomy closure and content
qualification remain owned by SEO.

### New

New first narrows merchant listings by active USD state and listing insertion
within the 72-hour boundary. Only that candidate scope reads first-observation
history. A listing is New only when its earliest known existence, using the
existing listing-insertion and first-observation rule, falls within the
boundary.

Winner selection remains landed-price ascending, observation time descending,
and product ID ascending. Median work remains absent from selection and runs
only for returned rows when `priceSignal` is selected.

### Trending

Trending retains one exact activity relation over explicit inclusive time
bounds. It counts distinct `(user_id, anonymous_visitor_id)` actor identities,
excludes actorless clicks, enforces the minimum identity threshold, and records
the most recent activity timestamp.

Pricing is restricted to products in that activity relation before computing
the exact median. Trending does not calculate first-seen history. It retains
the existing below-median requirement and deterministic activity ordering.

The activity relation remains a named materialized CTE when it is referenced
more than once inside the composed pricing query.

### Signed-In For You

The resolver evaluates the requested viewer page first. A non-empty page is
returned directly, eliminating the current full preflight ranking query.

When the first page is empty, fallback runs. When a later page is empty, a
minimal existence query determines whether personalized results exist but the
requested page is exhausted. Fallback runs only when no personalized match
exists at all. The existence query applies exact offer/watch eligibility but
does not join Product, calculate medians, rank the output page, or hydrate page
facts.

This preserves pagination semantics while removing duplicated expensive work
from the normal first-page path.

## Index Strategy

The existing covering price index remains the primary price-history access
path:

```text
(merchant_product_id, observed_at DESC, id DESC)
INCLUDE (price, shipping, in_stock)
```

It supports deterministic latest observation, first observation within a
listing scope, and arbitrary bounded price-history reads.

Trending replaces the timestamp-only click index with a covering index whose
leading timestamp supports arbitrary activity windows:

```text
(inserted_at, merchant_product_id)
INCLUDE (user_id, anonymous_visitor_id)
```

The migration creates the covering index concurrently, verifies the intended
definition, repairs an invalid or wrong same-named index, and drops the
superseded timestamp-only index only after the replacement is valid. Up and
down must be retryable after partial nontransactional execution and preserve at
least one time-window access path.

No index encodes seven days, 30 days, the minimum actor threshold, or another
current product-policy constant.

## Transactions And Failure Behavior

The existing per-rail repeatable-read transactions remain. Query refactoring
must not widen a transaction around the entire GraphQL request or introduce row
locks.

Database errors continue to fail the affected GraphQL field. They are not
translated into empty product or deal lists. Empty candidate scopes return
empty results without scanning price history. The local homepage UI retains its
current field-level failure and retry behavior.

No external calls, sleeps, or unbounded application processing may occur
inside the read transactions.

## Compatibility Contract

The following behavior is unchanged:

- GraphQL type and field names;
- Product nodes and Relay connections;
- response nullability;
- edge cursors and lookahead pagination;
- selected-product slug alias resolution and canonical Product identity;
- offer winner and rail ordering;
- deal reason codes and watch-target values;
- active-offer count and price-signal meanings;
- aliases and fragment-driven optional field projection;
- guest and signed-in fallback behavior;
- consistent landed-price, Product, reason, and optional-fact snapshots during
  concurrent writes and deletes.

No new public statistic API is added speculatively. The temporal internals use
explicit bounds so a later consumer can expose another exact range without a
schema migration or a range-specific table.

## Verification

Implementation begins with characterization tests and keeps all existing
homepage coverage. Focused tests must prove:

- identical products, offers, reasons, ordering, cursors, and optional facts
  for workspace, categories, New, Trending, For You, and fallback;
- deterministic latest-observation and winner tie-breaks;
- exact boundary behavior for freshness, New, Trending, and medians;
- first-seen aggregation is absent from workspace, Trending, and For You
  relations;
- median aggregation is absent when not required and scoped to the selected
  page or relevant candidate product IDs when required;
- normal first-page For You performs one ranking query;
- an empty later For You page distinguishes exhaustion from fallback with the
  minimal existence read;
- query budgets remain independent of requested page size;
- aliases and fragments continue to activate only the corresponding page
  facts;
- concurrency barriers continue to prove one snapshot for candidate selection,
  reasons, Product hydration, and page facts;
- the click covering-index migration is correct, concurrent, prefix-aware,
  retryable, reversible, and repairs invalid same-named indexes.

Verification must include the complete focused homepage database and GraphQL
suites, the full backend suite, quality, typecheck, formatting, work-queue
validation, and diff checks.

The batch does not add latency thresholds, estimated-cost assertions,
buffer-count assertions, timing comparisons, or representative-cardinality
planner gates. Structural scaling requirements are verified through exact
query scope, relation presence or absence, fixed query counts, index definition,
and behavior tests.

## Non-Goals

- Precomputed latest-offer, first-seen, median, activity, or relevance tables.
- Approximate distinct counts or probabilistic statistics.
- Cached or eventually consistent homepage results.
- A new public analytics API.
- Redesigning the homepage UI or GraphQL schema.
- Replacing Relay offset cursors.
- A broad rewrite of non-homepage price-history consumers.
- Splitting each query helper into its own module.
