# Shared Product Slug Storage Integrity

## Snapshot

- Status: ready
- Priority: P1
- Plan:
  `docs/superpowers/plans/2026-08-05-shared-product-slug-storage-integrity-implementation-plan.md`
- Last verified: 2026-08-05 against both owning changesets, the original table
  migrations, the shared reservation migration, and focused catalog tests.

## Target Outcome

PostgreSQL rejects canonical product slugs and historical product slug aliases
that do not match the exact lexical language already required by their owning
changesets, while cross-table uniqueness, alias immutability, lookups, search,
and public catalog behavior remain unchanged.

## Ready Evidence

- `Product.changeset/2` validates `products.slug` with
  `^[a-z0-9]+(?:-[a-z0-9]+)*$`.
- `ProductSlugAlias.changeset/2` applies the same validation to
  `product_slug_aliases.slug`.
- PostgreSQL's equivalent POSIX expression is
  `^[a-z0-9]+(-[a-z0-9]+)*$`.
- Both columns are non-null and have table-local uniqueness, but neither table
  has a lexical check constraint.
- `product_slug_namespace_uq` and the existing reservation triggers already
  enforce one cross-table namespace; the alias trigger already prevents direct
  identity updates. Those responsibilities are complete and outside this
  batch.
- `test/product_compare/catalog/product_lookup_test.exs` directly protects
  namespace collisions and alias immutability.
- `test/product_compare/catalog/search_documents_test.exs` protects historical
  alias capture and search refresh behavior.
- The live preflight returned zero invalid rows across `products` and
  `product_slug_aliases`.
- The focused product-lookup plus catalog-GraphQL baseline passed 48 tests with
  0 failures.

## Exact Preflight

```sql
SELECT 'products' AS table_name, id, slug
FROM products
WHERE slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$'
UNION ALL
SELECT 'product_slug_aliases' AS table_name, id, slug
FROM product_slug_aliases
WHERE slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$'
ORDER BY table_name, id;
```

The implementation begins only when this query returns zero rows.

## Boundaries

- Preserve the exact existing accepted slug language.
- Add no normalization, trimming, case folding, transliteration, Unicode, or
  length policy.
- Preserve all reservation indexes, functions, and triggers unchanged.
- Preserve product routes, redirects, lookup semantics, search documents,
  GraphQL contracts, and frontend behavior.
- Add only two named table checks and their owning changeset mappings.
- Add no generic slug helper, macro, registry, or policy framework.
- Use the reserved forward migration
  `20260805080000_enforce_shared_product_slug_storage_integrity.exs`.

## Internal Slices

1. Exact preflight plus failing direct-write characterization on both tables.
2. Two named PostgreSQL checks plus owning changeset mappings.
3. Namespace, immutability, lookup, search, and GraphQL parity plus complete
   backend gates.

## Verification

- `test/product_compare/repo/shared_product_slug_storage_integrity_test.exs`
- `test/product_compare/catalog/product_lookup_test.exs`
- `test/product_compare/catalog/search_documents_test.exs`
- `test/product_compare_web/graphql/catalog_queries_test.exs`
- full backend test, type, quality, and formatting gates
- `mix work_queue.validate`
- `git diff --check`

## Blocker Rule

Stop if the exact preflight returns any row. Record the table, row ID, and slug
and request a data decision; do not normalize, rename, delete, or reserve a
replacement slug inside this batch.
