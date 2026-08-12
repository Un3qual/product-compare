# Homepage Database Remediation Design

## Status

Approved in substance by the 2026-08-11 DBA review and the follow-up request to
fix every confirmed issue except the proposed performance gates. This document
makes that scope precise before implementation.

## Goal

Make the homepage and anonymous-attribution database paths correct under
concurrency, bounded for their presentation-sized results, and maintainable as
`price_points`, click sessions, products, and visitor identities grow.

## Scope

This remediation includes every confirmed issue with a direct, semantics-
preserving code or schema fix:

- bound every public homepage Relay traversal before SQL executes;
- preserve watch-rule matches when multiple targets exist;
- use one database snapshot for every multi-statement homepage rail;
- exclude future clicks from Trending;
- resolve historical product slugs to canonical products;
- avoid computing unselected active-count and price-signal facts;
- apply New's 72-hour offer cutoff before first-seen price-history work;
- make the workspace product-first so its limit can stop eligibility work;
- remove redundant general offer qualification from USD homepage SEO;
- replace avoidable specification and category distinct counts;
- remove redundant Trending aggregate, order, and distinct stages;
- scope active-offer counts and Product hydration to returned candidate pages;
- stop loading evidence/source associations for homepage specification labels;
- avoid a conflict-writing visitor insert on every repeat click;
- put the final anonymous-visitor tables, foreign key, indexes, and same-row
  constraint directly in the original commerce-attribution migration; and
- add the latest-price access path used by current-offer probes.

The following review proposals are deliberately excluded:

- no representative-cardinality `EXPLAIN (ANALYZE, BUFFERS)` CI gates;
- no planner-node, buffer-count, or temporary-file assertions;
- no asynchronous rolling-median/materialized homepage read model without
  production sizing data; and
- no anonymous-visitor deletion policy. Visitor deletion changes historical
  attribution semantics and requires a product-level retention decision, not a
  query-only patch. The final foreign key continues to detach a deleted visitor
  from historical clicks without deleting attribution records.

Ordinary deterministic behavior, concurrency, migration-contract, and query-
shape regression tests remain required. They are tests of correctness, not the
excluded performance gates.

## Considered Approaches

### 1. Direct candidate-first query remediation — selected

Rewrite the existing Ecto queries around the actual six-row presentation
boundary, add only the physical indexes those queries require, and keep the
current Catalog, SEO, Pricing, Alerts, Commerce Attribution, and GraphQL
ownership boundaries. This removes proven wasted work without introducing a
second data authority.

### 2. Maintained homepage read models

Persist latest prices, first-seen timestamps, rolling medians, Trending
activity, and category counts in dedicated summary tables. This would provide
the lowest read latency but adds ingestion coupling, freshness policy, repair
jobs, and consistency failure modes. It is premature without production
cardinality and latency evidence.

### 3. Caps and indexes only

Add cursor caps and covering indexes without changing query composition. This
reduces the easiest abuse paths but leaves catalog-wide aggregates, repeated
subqueries, and snapshot bugs intact. It does not satisfy the request to fix
the confirmed issues.

## Query Architecture

### Homepage connection boundary

All five homepage connections use the existing 1,000-row finite traversal
window. Cursor
validation and the traversal-cap check happen before selected-slug, relevance,
or candidate queries. Invalid cursors return the existing GraphQL error shape
and execute zero SQL.

The cap is a presentation safety boundary, not a promise of exhaustive catalog
pagination. Full browsing remains the catalog route's responsibility.

### Current price and New offers

Latest-price reads are candidate-scoped and deterministic by
`observed_at DESC, id DESC`. A concurrent migration creates
`price_points_home_latest_idx` on
`(merchant_product_id, observed_at DESC, id DESC) INCLUDE (price, shipping,
in_stock)`. After that index is valid, the migration concurrently removes the
superseded non-covering `price_points_mp_time_idx`.

New-offer selection first restricts active USD merchant products to
`inserted_at >= now - 72 hours`. This pushdown is logically equivalent because
`least(inserted_at, first_seen_at) >= cutoff` requires both values to meet the
cutoff. Only those surviving merchant products probe first and latest price
observations. Active-offer counts are computed only for product IDs on the
returned page and only when the GraphQL selection requests the field.

### Workspace

The workspace begins from Products in the existing deterministic ID order.
Specification and current-offer eligibility are expressed as indexed semi-
joins or `EXISTS` predicates, allowing PostgreSQL to stop after the requested
window rather than materializing global distinct product sets. Highlights and
offer facts are hydrated for that page inside the same repeatable-read
transaction.

### SEO shortcuts

Product content qualification is separated from offer qualification. Canonical
SEO reads apply the general eligible-offer scope once; homepage shortcuts apply
the USD scope once. Shortcut selection and canonical counts execute within one
repeatable-read snapshot.

The specification threshold uses a bounded second-row existence check. Where
the schema proves one category/product pair, the aggregate uses `count(*)`
instead of `count(DISTINCT product.id)`.

### Trending and viewer relevance

Trending activity has both lower and upper request-time bounds. It aggregates
`ROW(user_id IS NOT NULL, COALESCE(user_id, anonymous_visitor_id))` with a
filter requiring either actor foreign key. The mutually exclusive columns make
that composite one collision-free identity without string tagging. The query
exposes an unordered
one-row-per-product candidate relation. Consumers do not add another distinct
or preserve an irrelevant inner order. When a candidate relation is reused in
one statement it is owned once through an Ecto CTE with `materialized: true`
rather than textually expanded into each price scope.

Watch candidates remain one row per real rule until the current offer predicate
has been applied. Ranking then selects the tightest satisfied target, so an
unmet lower target cannot hide a met higher target. Multiple rules remain
legal: adding uniqueness now would require an unapproved merge policy for
existing rule state and alert-event history. Identical satisfied rows collapse
only after offer matching, where they cannot suppress a valid target.

Trending and signed-in viewer resolution wrap candidate selection, fallback
classification, optional fact hydration, and Product hydration in one
repeatable-read transaction. Historical slugs resolve through the existing
alias-aware batch lookup and return canonical products in normalized input
order.

### GraphQL-selected facts

The resolver inspects the requested `home_offer_summary` fields once at the
connection boundary and passes an explicit internal fact set into the domain
read. Candidate selection never depends on that set. Page-scoped active counts
and price signals are hydrated inside the same transaction only when selected.
This avoids both unrequested work and the prior cross-snapshot lazy-field bug.

Products are joined or hydrated once per returned page. The implementation must
not add per-edge field queries or a new generic dashboard/data-loader layer.

## Anonymous Visitor Schema And Write Path

The application is unreleased, so the original commerce-attribution migration
owns the final schema. It creates `anonymous_visitors` before click sessions,
then creates `commerce_click_sessions.anonymous_visitor_id`, the visitor entropy
and click lookup indexes, the foreign key, and the named single-actor check.
The click-session table never has an `anonymous_id` text column.

There is no expand/backfill deployment, transition column, trigger, legacy
mapping, rolling-writer window, contract migration, or rollback data
reconstruction. Development databases may be reset rather than preserving an
unreleased intermediate schema. A fresh-prefix migration test proves the final
tables, indexes, foreign key, same-row check, and direct-write rejection.

The runtime visitor lookup uses a read fast path. On a miss it performs the
unique-authoritative insert with conflict handling and rereads after a conflict.
The uniqueness constraint, not the preflight read, remains the concurrency
authority. Repeat clicks normally execute one indexed read and no failed write.

## Specification Highlights

Homepage highlights load only associations needed to format the selected
claim—attribute, unit, and enum option. Evidence links, artifacts, and sources
remain available to full product/specification reads but are not preloaded for
three plain homepage labels.

## Failure And Concurrency Semantics

- Repeatable-read failures use the existing repository transaction contract.
- A candidate whose Product or offer disappears after the snapshot remains
  internally consistent for that request.
- Personalized preflight and page reads cannot observe different states.
- Missing aliases and deleted products are omitted without `Map.fetch!`
  crashes; valid historical aliases resolve to their canonical Product.
- Optional GraphQL fields never issue work after their owning transaction has
  closed.
- Database uniqueness and foreign keys remain authoritative; no race-prone
  application-only invariant replaces them.

## Verification

Implementation follows RED/GREEN behavior tests for:

- zero-query rejection of deep cursors on every homepage connection;
- multiple satisfied and unsatisfied watch targets;
- deterministic concurrent deletion/deactivation barriers for Trending and
  viewer rails;
- future-click exclusion;
- historical-slug canonicalization;
- exact production GraphQL operations omitting unused aggregates;
- old-offer/large-history New selection and page-scoped active counts;
- workspace and SEO semantic equivalence after query rewrites;
- single composite Trending identity and no redundant candidate distinct;
- homepage highlights without evidence/source queries;
- repeat visitor lookup without conflict writes plus concurrent first-click
  convergence; and
- fresh-schema visitor table, index, foreign-key, same-row constraint, and
  invalid direct-write coverage.

Tests can inspect generated SQL for the presence or absence of an owning
predicate, CTE, aggregate, or association query when that is the public query
contract. They must not assert exact planner node names, cost estimates,
buffers, timing, or production-cardinality thresholds.
