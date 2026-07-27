# Ranked Catalog Search Design

## Purpose

Turn the existing catalog text filter into deterministic relevance-ranked
search while preserving the current GraphQL, Relay pagination, taxonomy,
specification-filter, compare-selection, and explicit-sort contracts.

The shopper outcome is simple: a search for a known identifier or product
should put that product first, small spelling mistakes should still find useful
results, and choosing a named sort should continue to mean exactly what its
label says.

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

## Selected Approach

Use PostgreSQL `pg_trgm` plus a deterministic tiered ranking query inside the
existing catalog boundary.

This is preferred over:

1. a generated full-text search document, which would require synchronization
   for brand and identifier changes and adds more storage policy than this
   product needs;
2. an external search service, which adds indexing operations, failure modes,
   and infrastructure before the catalog requires them; and
3. loading a page and ranking it in Elixir or React, which would make ranking
   incorrect across pages and disconnect result counts from visible results.

No separate search index table or external service is introduced.

## Search Matching Contract

The normalized nonblank query remains a catalog filter. A product matches when
at least one of these conditions is true:

- a validated GTIN exactly matches the value produced by the existing
  `ProductCompare.Catalog.GTIN.normalize/1` authority;
- product name, slug, model number, or brand name is an exact, prefix, or
  case-insensitive contains match;
- product name, slug, model number, or brand name meets the trigram similarity
  threshold; or
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

## Relevance Ranking Contract

When relevance applies, matching products are ordered by the highest matching
tier:

1. exact validated GTIN or exact model number;
2. exact product name or exact slug;
3. product name, slug, model number, or brand-name prefix;
4. product name, slug, model number, or brand-name contains match;
5. trigram match on product name, slug, model number, or brand name;
6. product-description contains match.

Within the winning tier, results sort by the greatest applicable trigram
similarity, then normalized product name, then product ID. The final product-ID
tie-breaker keeps Relay pages deterministic for equal names and scores.

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

Add a migration that enables `pg_trgm` and adds targeted trigram indexes for
the product and brand text fields used by typo-tolerant matching. The existing
validated identifier index remains the exact-identifier path.

Add one focused catalog-search query owner responsible for:

- applying the search predicate;
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
5. If relevance is selected or implied, the catalog-search owner applies the
   tier and tie-breaker order. Otherwise the existing explicit order applies.
6. The request-scoped discovery loader executes the existing bounded
   connection query.
7. Filter metadata applies the identical match predicate without ranking so
   the result count and facets describe the same product set.
8. The route renders the existing product cards, actions, filters, and
   pagination without receiving search-internal scores.

## Errors And Edge Cases

- Blank queries normalize to no search, as they do now.
- Non-string or longer-than-100-character queries retain the current GraphQL
  errors.
- Queries shorter than three characters use exact, prefix, and contains
  matching without trigram expansion.
- Punctuation-only queries are safe and may return an ordinary empty result.
- A query that resembles an invalid GTIN may still match ordinary text, but it
  cannot gain the exact-identifier tier.
- Missing brand, model number, or description cannot make the query fail.
- Search with no matches returns the existing empty catalog state.
- Explicit sorts remain deterministic when values tie.
- Query or sort changes do not reuse a stale cursor.

## Testing

Backend behavior tests cover:

- exact validated GTIN ranking through the existing GTIN normalizer;
- exclusion of unverified and rejected identifiers from the exact tier;
- exact model, product-name, and slug ranking;
- prefix, contains, typo-tolerant, and description tiers;
- the three-character trigram boundary and the `0.35` threshold;
- deterministic ties by normalized name and product ID;
- explicit Catalog, Product name, Brand name, and Newest overrides;
- relevance without a query falling back to Catalog order;
- combined taxonomy and typed specification filters;
- matching-set parity between product results and filter metadata;
- cursor pagination across tied search results;
- escaped wildcard and punctuation behavior;
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
