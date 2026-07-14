# Specification Provenance Read Contract Implementation Plan

**Goal:** Let shoppers inspect the accepted claim and safe source evidence for
every current specification without exposing raw source artifacts.

**Design:**
`docs/superpowers/specs/2026-07-13-canonical-catalog-and-provenance-design.md`

**Owned paths:**

- `lib/product_compare/specs.ex`
- `lib/product_compare_web/graphql/global_id.ex`
- `lib/product_compare_web/graphql/loader.ex`
- `lib/product_compare_web/resolvers/catalog_resolver.ex`
- `lib/product_compare_web/schema.ex`
- `assets/schema.graphql`
- `test/product_compare/specs/read_helpers_test.exs`
- `test/product_compare_web/graphql/catalog_queries_test.exs`
- `test/product_compare_web/graphql/global_id_test.exs`
- `test/product_compare_web/graphql/schema_snapshot_test.exs`
- `docs/work/product-trust-and-discovery.md`

## Tasks

1. Add failing context tests that load accepted current claims with source
   name/domain, fetched time, confidence, and bounded evidence excerpts while
   excluding raw payload fields.
2. Extend the current-attribute read model without adding per-row queries.
3. Add failing GraphQL tests and expose claim status/ID, confidence, source
   label, safe URL, fetched time, and evidence excerpt.
4. Update the schema snapshot and run focused GraphQL/spec tests, formatting,
   typecheck, queue validation, and `git diff --check`.

No correction mutation, imported-claim acceptance policy, or frontend redesign
is part of this read-contract slice.
