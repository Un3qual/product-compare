# Canonical Product Identity Implementation Plan

**Goal:** Resolve source listings with the same valid GTIN to one canonical
product while preserving source-local listings and refusing unsafe matches.

**Design:**
`docs/superpowers/specs/2026-07-13-canonical-catalog-and-provenance-design.md`

**Owned paths:**

- `priv/repo/migrations/20260713120000_create_product_identifiers.exs`
- `lib/product_compare_schemas/catalog/product_identifier.ex`
- `lib/product_compare_schemas/catalog/product.ex`
- `lib/product_compare/catalog/gtin.ex`
- `lib/product_compare/catalog.ex`
- `lib/product_compare/ingestion.ex`
- `test/product_compare/catalog/gtin_test.exs`
- `test/product_compare/ingestion/ingestion_test.exs`
- `docs/work/product-trust-and-discovery.md`

## Task 1: GTIN Normalization Contract

Write failing pure tests for GTIN-8, UPC-A, EAN-13, and GTIN-14 check digits,
format stripping, blanks, invalid lengths, non-digits, and invalid checksums.
Implement `ProductCompare.Catalog.GTIN.normalize/1` to return
`{:ok, normalized}` or `{:error, :invalid_gtin}` without integer coercion so
leading zeroes survive.

Verification:

```sh
mix test test/product_compare/catalog/gtin_test.exs
```

## Task 2: Identifier Persistence

Write failing schema/context tests through ingestion for the new
`product_identifiers` row. Add product, scheme, normalized/display values,
verification state, optional source artifact, and verification timestamp.
Constrain supported schemes and states, uniquely index validated
`scheme + normalized_value`, and associate identifiers from `Product`.

## Task 3: Conservative Ingestion Resolution

Write failing integration tests proving:

- different source/external IDs and merchants with the same valid GTIN share
  one product and retain separate external products/offers;
- blank or invalid GTIN values create no identifier and do not merge products;
- an existing source/external ID remains attached to its current product even
  if a later payload supplies a conflicting GTIN; and
- replay creates no duplicate identifiers.

Update fresh listing persistence so source artifact creation precedes identity
resolution. Resolve an existing validated GTIN before slug creation. When a new
product wins, insert its validated identifier and evidence. A uniqueness race
must fetch the winner and remove the unreferenced losing shell within the same
transaction; it must not silently rebind an already attached external product.

Verification:

```sh
mix test test/product_compare/catalog/gtin_test.exs \
  test/product_compare/ingestion/ingestion_test.exs
```

## Task 4: Milestone Verification And Evidence

Run the focused suite, format/type/queue gates, and `git diff --check`. Record
red-green evidence in the lane doc, retain the next three or more complete
ready rows, remove the active row, and commit code, migration, tests, plan, and
lane/queue evidence together.

