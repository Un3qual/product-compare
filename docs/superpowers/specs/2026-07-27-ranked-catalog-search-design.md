# Ranked Catalog Search Design

## Purpose

Turn the existing catalog text filter into deterministic relevance-ranked
search while preserving the current GraphQL, Relay pagination, taxonomy,
specification-filter, compare-selection, and explicit-sort contracts.

The shopper outcome is simple: a search for a known identifier or product
should put that product first, small spelling mistakes should still find useful
results, natural-language terms should match across product and brand content,
and choosing a named sort should continue to mean exactly what its label says.

## Verified Current State

- `ProductCompare.Catalog.Filtering` trims the query upstream, escapes SQL
  wildcard characters, and applies one case-insensitive contains predicate
  across product name, slug, model number, description, and brand name.
- Search results use catalog ID order unless the caller explicitly selects
  product name, brand name, or newest order.
- `ProductFiltersInput.query` is bounded to 100 characters and composes with
  the existing taxonomy, numeric, boolean, enum, and use-case filters.
- Product connections use the repository's existing offset-based opaque
  cursors and deterministic product-ID tie-breakers.
- Validated GTIN values already live in `product_identifiers` behind a partial
  unique index, but catalog search does not consult them. The schema permits
  MPN records but has no canonical MPN normalization policy, so this design
  does not make MPN identifiers a separate search authority.
- `/products` preserves search, explicit sort, filters, page size, comparison
  slugs, and pagination through its existing URL and Relay contracts.
- Product creation and updates flow through
  `ProductCompare.Catalog.Products`; ingestion already uses those catalog
  boundaries. The current brand upsert is keyed by name and does not rename an
  existing brand.
- Products have no full-text document today, and Ecto/PostgreSQL do not permit
  a generated product column to read the related brand row.

## Selected Approach

Use PostgreSQL `pg_trgm` and `tsvector` together inside the existing catalog
boundary. Trigram policy continues to own exact, partial, and typo-tolerant
matching. Full-text policy adds token-aware, stemmed, multi-field discovery.

This is preferred over:

1. a product-only generated full-text column, which cannot include brand names
   and would make queries spanning brand and product text incomplete;
2. database triggers, which would hide synchronization outside the catalog
   mutation boundary and are explicitly prohibited for this outcome;
3. a separate search-document table or external search service, which adds a
   second lifecycle or new infrastructure before the catalog requires it; and
4. loading a page and ranking it in Elixir or React, which would make ranking
   incorrect across pages and disconnect result counts from visible results.

Add an application-maintained `products.search_document` column. Catalog
product writes refresh it transactionally, an explicit post-deployment rebuild
backfills existing products and repairs drift, and search indexes are created
concurrently. No database trigger, separate search table, or external service
is introduced.

## Search Matching Contract

The trimmed nonblank query remains a catalog filter. A product matches when
at least one of these conditions is true:

- a validated GTIN exactly matches the value produced by the existing
  `ProductCompare.Catalog.GTIN.normalize/1` authority;
- product name, slug, model number, or brand name is an exact, prefix, or
  case-insensitive contains match;
- product name, slug, model number, or brand name meets the trigram similarity
  threshold;
- the maintained full-text document matches the shopper query; or
- product description contains the query case-insensitively.

Identifier matching uses an `EXISTS` subquery so one product appears only once.
Only `scheme = "gtin"` and `verification_status = "validated"` identifiers
participate in exact identifier matching. Unverified and rejected identifiers
remain invisible to this search authority.

Existing wildcard escaping remains authoritative, so `%`, `_`, and backslash
in user input are literal search characters rather than SQL patterns. Trigram
matching is disabled for queries shorter than three characters. The fixed
similarity threshold is `0.35`; changing it later is a reviewed search-policy
change, not runtime configuration.

Case folding for exact, prefix, contains, and trigram comparisons happens in
PostgreSQL on both the catalog field and bound query value. Elixir does not
pre-lowercase search text, because Unicode casing must use the same database
collation on both sides of each comparison.

Full-text parsing uses both:

- `websearch_to_tsquery('simple', query)` for literal product, brand, model,
  slug, and technical terms; and
- `websearch_to_tsquery('english', query)` for stemming and ordinary prose.

The two parsed queries are combined with full-text OR. Each parsed branch keeps
the normal web-search AND semantics between unquoted terms and supports quoted
phrases, uppercase `OR`, and `-` exclusions. PostgreSQL's web-search parser is
the raw-input boundary, so malformed punctuation cannot produce a tsquery
syntax error. If both parsed branches contain no lexemes, full-text matching is
false and the remaining exact, partial, trigram, and description predicates
continue normally.

The stored document contains both configurations so one query can match terms
distributed across brand, product name, model number, slug, and description:

- weight A: `simple` brand name, product name, model number, and slug terms;
- weight B: `english` brand name, product name, and slug terms;
- weight C: `simple` description terms; and
- weight D: `english` description terms.

The builder inserts then removes an unqueryable sentinel lexeme between each
weighted vector. Removing the lexeme preserves a positional gap, so quoted
phrases cannot match across artificial configuration or field-copy
boundaries.

## Relevance Ranking Contract

When relevance applies, matching products are ordered by the highest matching
tier:

1. exact validated GTIN or exact model number;
2. exact product name or exact slug;
3. product name, slug, model number, or brand-name prefix;
4. product name, slug, model number, or brand-name contains match;
5. full-text match across the maintained search document;
6. trigram match on product name, slug, model number, or brand name;
7. product-description contains match.

Within the full-text tier, results first sort by `ts_rank_cd` using the document
weights above. All tiers then sort by the greatest applicable trigram
similarity, normalized product name, and product ID. Full-text rank is zero
outside its tier. The final product-ID tie-breaker keeps Relay pages
deterministic for equal names and scores.

The API does not expose a relevance score or matching field. Those values are
query policy, not durable product facts.

## Explicit Sort Semantics

Add `RELEVANCE` to the GraphQL `ProductSort` enum and the frontend sort
contract.

Sort behavior is exact:

- a nonblank query with no explicit sort uses relevance;
- explicit `RELEVANCE` with a nonblank query uses relevance;
- explicit Catalog order, Product name, Brand name, or Newest order overrides
  relevance while retaining the search predicate and all other filters;
- `RELEVANCE` without a nonblank query safely behaves as Catalog order; and
- no query and no sort retains the existing Catalog order.

This makes relevance the search default without changing the meaning of an
existing explicit sort.

## Database And Query Boundaries

Add staged migrations that:

- enables `pg_trgm`;
- adds `products.search_document` as a nullable `tsvector` without a default or
  table rewrite;
- defines one pure, explicitly invoked SQL function that builds the weighted
  document from product and brand text;
- creates the `search_document` and targeted product and brand search indexes
  concurrently outside a migration transaction.

Concurrent index creation intentionally omits `IF NOT EXISTS`. If PostgreSQL
leaves an invalid index after an interrupted concurrent build, retrying the
migration must fail visibly instead of silently accepting the unusable index.

The document-building function reads no tables and mutates no rows. It accepts
text values and returns a `tsvector`, allowing the deployment rebuild and
application refresh path to share one weighting/configuration policy without a
trigger. Full-text predicates naturally treat an unbackfilled null document as
a non-match, and the guarded rank expression does not evaluate it as a
tier-five match. This preserves the raw-column GIN index path without an
unindexable `coalesce` wrapper. The existing validated identifier index remains
the exact-identifier path.

Add `ProductCompare.Catalog.SearchDocuments` as the application synchronization
owner. It provides:

- `refresh_product/1`, which joins the current product and brand values and
  refreshes one document;
- `refresh_products/1`, which refreshes an explicit set of product IDs;
- `refresh_brand/1`, which refreshes all products currently assigned to a
  brand; and
- `rebuild/0`, which refreshes all product documents.

`ProductCompare.Catalog.Products.create_product/1` and `update_product/2`
persist the product and refresh its document in the same repository
transaction. A refresh failure rolls back the product mutation. The existing
slug-alias transaction is extended rather than nested behind a second
independent commit. Changing a product's `brand_id` therefore refreshes both
product and brand terms atomically.

The current brand APIs do not rename or delete existing brands. A future
application brand rename must call `refresh_brand/1` in the same transaction.
A future brand deletion must capture the affected product IDs before deletion,
then call `refresh_products/1` after the foreign key clears `brand_id`, still
inside the same transaction. Direct `Repo` mutations of product or brand search
inputs are outside the supported catalog write contract.

Add an explicit `mix catalog.search_documents.rebuild` task for deployments,
manual repair, and drift recovery. It is not a scheduler and does not weaken
transactional refresh on ordinary writes.

Add one focused catalog-search query owner responsible for:

- applying the search predicate;
- building both safe web-search tsqueries;
- computing the deterministic ranking expressions; and
- applying relevance order.

`ProductCompare.Catalog.Filtering` remains the stable composition owner. It
delegates only search matching and relevance ordering, then continues to own
taxonomy, specification, use-case, and explicit sort composition. Filter
metadata continues to reuse the same matching predicate and exclude ordering
before counting.

The GraphQL resolver, request-scoped loader, and connection implementation keep
their current responsibilities. No resolver-specific search implementation is
added.

## Frontend Behavior

On `/products`:

- show **Relevance** in the sort control when a search query is active;
- select Relevance when the URL contains a query but no explicit sort;
- omit the default relevance sort from the canonical search URL;
- include `sort=ID_ASC` when the shopper explicitly chooses Catalog order for
  an active search;
- preserve explicit Product name, Brand name, and Newest values exactly;
- preserve the current filters, page size, and comparison slugs; and
- remove a stale pagination cursor whenever query or sort inputs change, as the
  current filter form already does.

Clearing the query while Relevance is selected returns to Catalog order on the
next normalized route state. Relevance is a default search policy, so it does
not produce a redundant active-filter summary item.

No new result badge, highlighted excerpt, suggestion list, or ranking
explanation is added.

## Data Flow

1. The route parses and bounds the query and optional explicit sort.
2. Relay sends the normalized `ProductFiltersInput`.
3. GraphQL validates the query, sort, taxonomy IDs, and typed filters.
4. `ProductCompare.Catalog.Filtering` composes the search predicate with the
   existing catalog filters.
5. The catalog-search owner builds the `simple` and `english` web-search
   tsqueries, then combines full-text matching with exact, partial, trigram,
   identifier, and description predicates.
6. If relevance is selected or implied, the catalog-search owner applies the
   seven tiers, full-text rank, and deterministic tie-breakers. Otherwise the
   existing explicit order applies.
7. The request-scoped discovery loader executes the existing bounded
   connection query.
8. Filter metadata applies the identical match predicate without ranking so
   the result count and facets describe the same product set.
9. The route renders the existing product cards, actions, filters, and
   pagination without receiving search-internal scores.

## Errors And Edge Cases

- Blank queries normalize to no search, as they do now.
- Non-string or longer-than-100-character queries retain the current GraphQL
  errors.
- Queries shorter than three characters use exact, prefix, contains, and any
  nonempty full-text token match without trigram expansion. They bypass the
  candidate-ID union because no trigram-selective bound exists and execute the
  combined match predicate through one joined product query.
- Punctuation-only queries are safe and may return an ordinary empty result.
- Web-search quotes, uppercase `OR`, and `-` exclusions retain PostgreSQL
  `websearch_to_tsquery` semantics.
- A query that resembles an invalid GTIN may still match ordinary text, but it
  cannot gain the exact-identifier tier.
- Missing brand, model number, or description cannot make the query fail.
- A failed search-document refresh rolls back the catalog product write.
- The explicit rebuild task restores documents after unsupported direct SQL or
  an interrupted deployment backfill.
- Search with no matches returns the existing empty catalog state.
- Explicit sorts remain deterministic when values tie.
- Query or sort changes do not reuse a stale cursor.

## Testing

Backend behavior tests cover:

- exact validated GTIN ranking through the existing GTIN normalizer;
- exclusion of unverified and rejected identifiers from the exact tier;
- exact model, product-name, and slug ranking;
- prefix, contains, full-text, typo-tolerant, and description tiers;
- multi-term matching across brand, product name, model, slug, and description;
- `simple` technical-term matching and `english` stemming;
- quoted phrases, uppercase `OR`, exclusions, stop-word-only input, and
  punctuation-only input;
- quoted phrases not crossing the stored simple/English vector boundaries;
- Unicode case-insensitive matching using the database collation;
- full-text rank ordering and deterministic equal-rank ties;
- the three-character trigram boundary and the `0.35` threshold;
- deterministic ties by normalized name and product ID;
- explicit Catalog, Product name, Brand name, and Newest overrides;
- relevance without a query falling back to Catalog order;
- combined taxonomy and typed specification filters;
- matching-set parity between product results and filter metadata;
- cursor pagination across tied search results;
- escaped wildcard and punctuation behavior;
- staged migration followed by explicit rebuild backfill of existing products;
- transactional document refresh after product creation, text edits, slug
  changes, and brand reassignment;
- brand-wide refresh behavior for a future application-owned rename path and
  explicit product-set refresh after a future brand deletion;
- rebuild repair after a deliberately stale document;
- rollback when document refresh fails;
- request-scoped loader reuse for identical search aliases; and
- canonical GraphQL SDL and Relay artifact generation.

Frontend behavior tests cover:

- Relevance as the default for an active query;
- Relevance absence on an unsearched catalog;
- explicit Catalog order serialization during a search;
- preservation of every named sort;
- query, filter, page-size, and compare-selection URL behavior;
- stale cursor removal; and
- normalized Relay variables for implicit and explicit relevance.

Verification ends with focused backend and frontend suites, schema and Relay
validation, TypeScript, formatting, type checking, the full repository CI
gate, and diff hygiene. Tests assert behavior and stable query counts; they do
not assert brittle `EXPLAIN` node strings or private SQL fragments.

## Non-Goals

- Autocomplete, search suggestions, result highlighting, or query analytics.
- External search infrastructure or a denormalized search-index table.
- Database triggers or trigger-managed search synchronization.
- A scheduled search-document reconciliation job.
- Semantic, vector, personalized, sponsored, or LLM-generated ranking.
- New GraphQL result fields for score, match reason, or excerpts.
- Changes to taxonomy, specification, recommendation, offer, ingestion, or
  comparison policy.
- New provider integrations or operator surfaces.
- A new canonical MPN normalization policy or identifier-ingestion workflow.
- Splitting indexes, backend ranking, GraphQL enum changes, and frontend sort
  behavior into separate queue rows.

## Dispatch Boundary

This design is one independently reviewable cross-stack search outcome. Its
database, backend, schema, Relay, and frontend work are internal slices of the
same acceptance boundary.

The live queue currently has no ready rows. Before implementation is claimed,
the coordinator must either validate enough independent source-backed
successors to satisfy the ready-row reserve or obtain an explicit one-time
waiver. The reserve rule must not be satisfied by splitting this search
outcome into micro-batches.
