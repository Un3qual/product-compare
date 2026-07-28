# Ranked Catalog Search Final Fix Report

Date: 2026-07-27

Repair milestone:
`f12dbf539115354da0c1d7480e7e73237ffe9649`
(`fix: bound ranked catalog search candidates`)

## Outcome

Both final aggregate findings are resolved.

1. Ranked catalog search now derives a distinct, index-supported
   candidate-product-ID set before applying the existing exact predicate and
   relevance expressions. The existing GTIN, exact, prefix, contains,
   full-text, trigram, description, sort, filter, metadata, Dataloader, and
   cursor semantics remain unchanged.
2. Ranked Catalog Search no longer appears as active work. The live queue has
   no active or ready rows, the catalog lane snapshot is done, and the ranked
   design and plan are retained only as completion history. The exact one-time
   queue waiver remains
   `Ready Work requires at least 3 complete rows; found 0`.

## Files

- `lib/product_compare/catalog/search.ex`
  - Builds independent candidate queries for validated GTIN, product and brand
    contains matches, persisted full text, and product and brand trigrams.
  - Combines them with `UNION ALL`, selects distinct product IDs, and applies
    that set before the unchanged exact match predicate and ranking.
  - Keeps candidate construction private; no test-only or speculative API was
    added.
- `priv/repo/migrations/20260727120000_add_ranked_catalog_search.exs`
  - Adds the missing description contains index.
  - Adds product and brand expression GIN indexes for immutable
    `show_trgm(...)` overlap candidate selection.
  - Preserves the existing product name, slug, model, brand, and persisted
    full-text indexes.
- `test/product_compare/catalog/search_test.exs`
  - Covers isolated name, slug, model, description, brand, full-text,
    validated-GTIN, short-query, wildcard, and all trigram-authority behavior.
  - Covers the boundary-only `"Ab"` versus `"abc"` match at similarity `0.4`
    and excludes `"Abx"` at similarity below `0.35`.
  - Asserts only public ranked-search behavior; it does not assert SQL source
    text or PostgreSQL planner node names.
- `docs/work/index.md`
  - Removes the completed live queue row without creating replacement work.
- `docs/work/frontend-catalog-browse.md`
  - Marks the lane snapshot done and records final architecture and
    verification evidence.
- `docs/plans/INDEX.md`
  - Removes the ranked design and plan from active entries and retains them as
    non-dispatch completion history.

## Candidate Design

The candidate set is the distinct union of:

1. the existing partial validated-GTIN authority;
2. `lower(field) LIKE escaped_contains_pattern` for product name, slug, model
   number, and description;
3. the equivalent brand contains query, followed through
   `products_brand_idx`;
4. the existing persisted `search_document` query; and
5. for queries of at least three characters, product name, slug, model number,
   and brand trigram candidates.

The trigram candidate is an index-supported superset:

```text
show_trgm(lower(coalesce(field, ''))) &&
show_trgm(normalized_query)
```

Any positive pg_trgm similarity requires at least one shared trigram, so this
cannot exclude a match at the fixed positive `0.35` threshold. The candidate
branch then applies the unchanged exact
`similarity(lower(coalesce(field, '')), normalized_query) >= 0.35` predicate.
This avoids relying on the mutable `pg_trgm.similarity_threshold` GUC used by
the `%` operator.

The outer query still applies the original exact OR predicate and original
ranking. Candidate generation is therefore a performance bound, not a new
search authority.

## RED-GREEN Evidence

RED:

- The initial behavior-first edit produced 17 tests with 6 expected failures
  and 11 passes.
- Every failure was `UndefinedFunctionError` for the not-yet-implemented
  candidate query seam used to prove validated-GTIN inclusion, path coverage,
  trigram coverage and boundary behavior, short-query behavior, and literal
  wildcard handling.
- No production code had been changed at that point.

GREEN:

- The candidate query and migration were implemented in the existing search
  boundary.
- The temporary candidate-query test seam was then removed so final coverage
  observes only public ranked-search results.
- `mix test test/product_compare/catalog/search_test.exs`:
  17 tests, 0 failures.
- Focused migration/search-document/rebuild/search verification:
  26 tests, 0 failures.
- Final focused search, metadata, GraphQL, schema, and Dataloader verification:
  127 tests, 0 failures.

## EXPLAIN Evidence

All probes used the actual Ecto query produced by
`Filtering.apply_filters(%{query: "aurora", sort: :relevance})`, default
PostgreSQL planner settings, representative transactional fixtures, and
`EXPLAIN (ANALYZE, BUFFERS)`. Fixture writes were rolled back.

Pre-repair, 30,000 products:

- `Parallel Seq Scan on products`
- 29,999 non-matching rows removed
- 1,320 shared-buffer hits
- 219.545 ms execution

Post-repair, 30,000 products across 1,000 brands:

- product full-text, contains, and trigram-overlap branches used their GIN
  indexes;
- distinct candidate IDs fed a product primary-key lookup;
- the unchanged final predicate saw one product;
- 170 shared-buffer hits;
- 6.056 ms execution, about 97% below the pre-repair probe.

Complementary brand-authority probe, 30,000 products and 30,000 brands:

- both brand contains and trigram-overlap branches used their GIN indexes;
- both resolved product IDs through `products_brand_idx`;
- the final brand join used the brand primary key;
- one product reached the unchanged final predicate;
- 21.440 ms execution.

PostgreSQL chose a cheap outer product scan to hash-join the already bounded
candidate set in the brand-distribution probe. It did not evaluate the
expensive exact predicate or ranking over the 30,000 products. Planner node
names remain observational evidence only and are not encoded in tests.

## Final Verification

- `mix format --check-formatted`: exit 0.
- `mix typecheck`: exit 0.
- Final focused backend command: exit 0; 127 tests, 0 failures.
- `MIX_ENV=test mix ecto.rollback --step 1`: exit 0 on the local test database.
- `MIX_ENV=test mix ecto.migrate`: exit 0 on the local test database.
- `MIX_ENV=test mix catalog.search_documents.rebuild`: exit 0;
  `Rebuilt 0 catalog search documents.` on the empty local test database.
- `cd assets && bun run check`: exit 0.
  - Relay: 52 reader, 51 normalization, and 51 operation-text documents.
  - TypeScript: exit 0.
  - Vitest: 104 files, 1,505 tests, 0 failures.
  - Client and SSR builds: exit 0.
  - Client bundle: 182,233 gzip bytes against the 200,000-byte budget.
- `mix quality`: exit 0.
  - Credo: no issues.
  - ExDNA: unchanged 3/3 clone budget.
  - Reach: no current issues; 11 baseline findings suppressed.
  - Dialyzer: 0 errors.
- `mix test --cover`: exit 0; 973 tests, 0 failures, 83.98% total coverage.
- `mix work_queue.validate`: exit 1 only with the exact approved waiver:
  `Ready Work requires at least 3 complete rows; found 0`.
- Targeted plan-state verification found no active ranked queue row, active
  ranked lane status, or active ranked design/plan label.
- `git diff --check`: exit 0.
- `mix ci` was not rerun and is not claimed to pass. Its queue validator is the
  exact waived result above; every remaining constituent gate was run
  directly.

Three first attempts (`mix catalog.search_documents.rebuild`,
`mix work_queue.validate`, and `mix quality`) were unable to open Mix's local
coordination socket inside the filesystem sandbox (`:eperm`). Each was rerun
with the permitted execution scope; the rebuild and quality gate passed, and
the queue validator produced only the exact approved waiver. These were
environmental launch failures, not product or test failures.

## Queue State

- Active rows: 0.
- Ready rows: 0.
- Added replacement rows: 0.
- Waived validator result:
  `Ready Work requires at least 3 complete rows; found 0`.
- Next dispatch requires a new product or quality decision followed by fresh,
  source-backed candidate validation.

## Remaining Concerns

No blocking correctness or verification concern remains.

- One- and two-character contains searches cannot be selectively accelerated
  by trigram indexing; trigram matching remains disabled below three
  characters and the exact short-query behavior is preserved.
- PostgreSQL can still choose a sequential scan as a cheap join strategy for a
  candidate-ID relation under some distributions, as observed in the
  30,000-brand probe. The expensive final predicate remains candidate-bounded;
  production plans should still be monitored as catalog distributions grow.
- The additional GIN expression indexes trade write cost and storage for a
  threshold-independent, false-negative-free trigram candidate superset.
