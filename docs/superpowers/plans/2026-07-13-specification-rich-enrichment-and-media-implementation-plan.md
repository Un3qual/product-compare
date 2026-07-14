# Specification-Rich Enrichment And Media Implementation Plan

**Goal:** Persist source-backed catalog enrichment, media, typed specification
proposals, and reviewable category mappings without inventing provider fields
or allowing newer provider copy to overwrite curated product truth.

**Design:**
`docs/superpowers/specs/2026-07-13-canonical-catalog-and-provenance-design.md`

**Owned paths:**

- `lib/product_compare/ingestion/normalized_listing.ex`
- `lib/product_compare/ingestion/media_observation.ex`
- `lib/product_compare/ingestion/specification_observation.ex`
- `lib/product_compare/ingestion/sources/cj/product_parser.ex`
- `lib/product_compare/ingestion.ex`
- `lib/product_compare/catalog.ex`
- `lib/product_compare/specs.ex`
- `lib/product_compare/taxonomy.ex`
- `lib/product_compare_schemas/catalog/product.ex`
- `lib/product_compare_schemas/catalog/product_media.ex`
- `lib/product_compare_schemas/specs/product_attribute_claim.ex`
- `lib/product_compare_schemas/ingestion/category_mapping_candidate.ex`
- `lib/product_compare_web/schema.ex`
- `lib/product_compare_web/resolvers/catalog_resolver.ex`
- `lib/product_compare_web/graphql/loader.ex`
- `priv/repo/migrations/*_add_product_enrichment.exs`
- `test/product_compare/ingestion/enrichment_test.exs`
- `test/product_compare/ingestion/sources/cj/product_parser_test.exs`
- `test/product_compare/catalog_test.exs`
- `test/product_compare/specs_test.exs`
- `test/product_compare/taxonomy_test.exs`
- `test/product_compare_web/graphql/catalog_queries_test.exs`
- `assets/schema.graphql`
- `docs/work/product-trust-and-discovery.md`

## Safety Contract

- The normalized contract accepts optional enrichment, but each adapter emits
  only fields supported by its captured or live evidence.
- Curated product fields are never overwritten merely because provider copy is
  newer. Imports may fill a missing model number or description.
- Media accepts only HTTP(S) URLs, keeps source-artifact provenance, orders
  deterministically, and remains replay-safe.
- Imported specifications become typed proposed claims with artifact evidence.
  They do not become current values unless an explicit source/attribute policy
  accepts and selects them.
- Exact configured category aliases may assign a type. Unmapped provider paths
  create or refresh a reviewable candidate and leave the current type intact.
- A malformed optional media/spec/category item cannot discard a valid offer.

## Tasks

1. Write failing normalized-contract and ingestion tests for missing-field
   preservation, media validation/order/replay, typed claim evidence/replay,
   isolated optional-field errors, exact category mapping, and unmapped
   candidates.
2. Add source-neutral media/specification observation structs and fixture-
   backed CJ category enrichment without guessing unsupported CJ fields.
3. Add source-backed product media and category-mapping candidate persistence.
4. Add idempotent imported-claim fingerprints and explicit auto-accept policy
   hooks that reuse the existing claim/current workflow.
5. Fill only missing canonical model/description fields and persist enrichment
   outcomes alongside the existing catalog/offer result.
6. Expose ordered safe media in GraphQL, regenerate the schema snapshot, and
   run focused ingestion/catalog/spec/taxonomy/schema gates.

Authenticated specification corrections are the next trusted-catalog
milestone. They remain outside this ingestion slice.

## Completion Evidence

- The focused enrichment, parser, catalog, Specs, Taxonomy, and GraphQL run
  passed 47 tests; the expanded affected backend run passed 175 tests.
- The generated schema snapshot is current. Relay validation compiled 30
  reader, 29 normalization, and 29 operation documents, and frontend
  TypeScript passed.
- Formatting, backend type checking, queue validation with four ready rows,
  and diff hygiene passed.
