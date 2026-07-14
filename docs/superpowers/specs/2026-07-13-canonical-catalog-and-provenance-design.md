# Canonical Catalog And Specification Provenance Design

## Goal

Turn provider listings into canonical, richly specified products without
losing source evidence or silently combining different models.

## Canonical Identity

Add a `product_identifiers` relation with product, scheme, normalized value,
display value, source artifact, verification state, and timestamps. Initial
schemes are GTIN and MPN; the scheme/value pair is unique only after validation.
Provider-local listing IDs remain in `external_products` and are not treated as
global identifiers.

Identity resolution follows a conservative ladder:

1. An existing `external_products` source/external ID remains bound to its
   current product.
2. An exact, syntactically valid GTIN that has one validated owner reuses that
   product.
3. Exact brand plus MPN may create a match candidate, but does not auto-merge
   until normalization and collision evidence justify promotion.
4. Otherwise ingestion creates a new provisional product shell and records the
   signals that could later support a merge.

Conflicting validated identifiers fail the import item safely and create an
operator-visible conflict. Product merges are explicit audited operations that
repoint dependent rows transactionally and preserve aliases from retired slugs.

## Enriched Normalized Listing

The source-neutral listing contract gains optional model number, description,
manufacturer category path, images, and typed specification observations.
Adapters populate only provider fields supported by captured fixtures or live
provider evidence; missing data stays missing. Image entries include URL,
role, ordering, and source artifact. Specification observations include a
stable attribute code, typed raw value, unit when applicable, confidence, and
evidence excerpt or path.

Product shells use the best accepted source-backed title, brand, model, primary
taxon, description, and image. Provider copy does not overwrite curated values
merely because it is newer.

## Specifications And Provenance

The existing `ProductAttributeClaim`, `ClaimEvidence`, and
`ProductAttributeCurrent` models remain authoritative. Imports propose typed
claims linked to their `SourceArtifact`. Automatic acceptance is limited to
configured source/attribute policies and valid units or enum values. Conflicts
remain proposed for review. Current values change through the existing claim
selection workflow, making history append-only and auditable.

Public specification fields expose:

- normalized typed value and display value;
- accepted claim ID and confidence;
- source label and safe evidence link/excerpt;
- fetched or observed timestamp; and
- whether newer conflicting proposals exist.

## Corrections

Authenticated users may propose a replacement claim with a reason and source
URL or explanation. The mutation never selects the new claim directly.
Operator moderation accepts or rejects it, and acceptance may select it as
current in the same transaction. Users can read the state of their own
proposals; public pages show accepted history and aggregate correction state,
not private moderation notes.

## Media And Taxonomy

Add source-backed product media with deterministic ordering and validation for
HTTP(S) URLs. Do not proxy or download remote media in the first slice. Taxon
mapping uses explicit provider-category aliases. Unmapped categories retain a
reviewable mapping candidate rather than assigning every item to the generic
`Ingested Product` taxon indefinitely.

## Error And Replay Behavior

Listing persistence remains replay-safe. Replaying the same artifact creates
no duplicate identifier, media, claim, evidence, product, or price row. One
invalid specification does not discard a valid offer; item results report
catalog, spec, media, and offer outcomes separately. A source observation older
than the existing external product cannot change canonical identity or current
catalog fields.

## Verification

Contract and integration tests cover same-GTIN multi-merchant resolution,
invalid and conflicting identifiers, no unsafe brand/title merge, replay,
typed claims and evidence, correction moderation, taxon mapping, media order,
and public provenance redaction.
