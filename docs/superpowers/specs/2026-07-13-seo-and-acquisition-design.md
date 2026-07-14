# SEO And Acquisition Surfaces Design

## Goal

Make trustworthy public product knowledge discoverable without producing thin,
duplicate, private, or misleading indexable pages.

## Indexable Surfaces

Initial public surfaces are canonical product detail pages, qualified merchant
detail pages, selected taxon/category landing pages, and explicitly published
comparison snapshots. Search/filter URLs, account pages, ingestion/operator
pages, saved comparisons, alert pages, and arbitrary parameter combinations
are not indexable.

A page qualifies only when it has a stable canonical identity, unique title and
description, an accepted image or adequate text fallback, useful accepted
specifications, and sufficiently fresh public offers where offer claims are
shown. Unqualified pages emit `noindex` and do not enter sitemaps.

## Metadata And Structured Data

Route metadata becomes data-driven on server render and client navigation.
Product pages emit canonical URL, Open Graph/Twitter fields, and schema.org
`Product` JSON-LD. `AggregateOffer` and `AggregateRating` are included only when
their current, public source data satisfies the same rules as the visible page.
Merchant pages emit `Organization` only for factual identity fields. Published
comparison snapshots use descriptive metadata and canonical public tokens.

Structured data is serialized from typed server-owned values, never assembled
from unsanitized user Markdown. Price currency, low/high price, availability,
rating counts, and observation dates match the rendered page.

## Sitemaps, Robots, And Canonicals

Phoenix serves `robots.txt` and partitioned XML sitemaps. Sitemap reads are
bounded, deterministic, cached, and contain only qualifying canonical URLs and
truthful last-modified times. Alternate slugs redirect permanently to the
canonical product or merchant slug. Parameterized browse and compare URLs point
to their canonical base or use `noindex,follow` as appropriate.

## Category Acquisition

Taxon pages explain the comparison dimensions that matter, show useful accepted
attributes and fresh products, and link into browse filters. Content is sourced
from curated taxonomy metadata and product aggregates, not generated filler.
Pages below quality or inventory thresholds remain unindexed.

## Measurement And Privacy

Acquisition measurement reuses first-party, privacy-reviewed attribution
boundaries. This design does not add third-party trackers or consent-sensitive
scripts. Search bots never receive personalized account state.

## Verification

Tests cover SSR metadata, canonical URLs, redirects, noindex decisions,
JSON-LD escaping and factual consistency, rating/offer omission rules, sitemap
qualification and pagination, robots output, private-route exclusion, and
client navigation metadata updates.

