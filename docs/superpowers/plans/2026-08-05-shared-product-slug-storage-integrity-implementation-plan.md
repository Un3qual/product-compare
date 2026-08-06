# Shared Product Slug Storage Integrity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make PostgreSQL preserve the canonical lexical shape already required for canonical product slugs and historical product slug aliases.

**Architecture:** One forward migration preflights both members of the shared product slug namespace and adds one named POSIX-regex check to each table. The two existing changesets map those names, while focused direct-write tests and existing lookup/search suites protect the surrounding reservation and immutability behavior.

**Tech Stack:** Elixir 1.19, Ecto 3.13, PostgreSQL POSIX regular expressions and check constraints, ExUnit.

## Global Constraints

- Preserve the established Ecto language `^[a-z0-9]+(?:-[a-z0-9]+)*$`; use PostgreSQL POSIX equivalent `^[a-z0-9]+(-[a-z0-9]+)*$`.
- Keep `product_slug_namespace_uq` and all existing reservation and alias-immutability functions and triggers unchanged.
- Add no normalization, length, Unicode, route, redirect, GraphQL, or generic slug policy.
- Stop if either table contains a violating row; do not rewrite, normalize, delete, or reserve replacement values.
- Add a new reversible forward migration; do not rewrite applied migrations or reset the development database.
- Use TDD: establish the direct-write failures before adding the constraints.

---

### Task 1: Enforce The Shared Product Slug Lexical Boundary

**Files:**

- Create: `priv/repo/migrations/20260805080000_enforce_shared_product_slug_storage_integrity.exs`
- Create: `test/product_compare/repo/shared_product_slug_storage_integrity_test.exs`
- Modify: `lib/product_compare_schemas/catalog/product.ex`
- Modify: `lib/product_compare_schemas/catalog/product_slug_alias.ex`
- Verify: `test/product_compare/catalog/product_lookup_test.exs`
- Verify: `test/product_compare/catalog/search_documents_test.exs`
- Verify: `test/product_compare_web/graphql/catalog_queries_test.exs`
- Modify: `docs/work/shared-product-slug-storage-integrity.md`

**Interfaces:**

- Consumes: `Product.changeset/2`, `ProductSlugAlias.changeset/2`, the two
  persisted `slug` columns, and the existing reservation/immutability triggers.
- Produces: named PostgreSQL checks `products_slug_canonical_format` and
  `product_slug_aliases_slug_canonical_format`, each mapped to `:slug` by its
  owning changeset.

- [ ] **Step 1: Run the exact live-data preflight**

  Run this read-only query before writing the migration:

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

  Expected: zero rows. If any row is returned, stop and follow the blocker rule
  in the lane document.

- [ ] **Step 2: Write the failing direct-write tests**

  In `shared_product_slug_storage_integrity_test.exs`, create valid product and
  alias owners, then use `Ecto.Adapters.SQL.query/3` to assert each invalid
  direct insert returns its owning named constraint:

  - `products_slug_canonical_format` for `Uppercase`, `-leading`, `trailing-`,
    `double--hyphen`, `with space`, `café`, and `punctuation!`.
  - `product_slug_aliases_slug_canonical_format` for the same invalid families.

  Include accepted controls `a`, `product-2`, and `a1-b2-c3` for both tables.
  Use unique values and owners so the existing namespace reservation does not
  mask the lexical assertion.

- [ ] **Step 3: Run the focused test and verify RED**

  Run:

  ```bash
  mix test test/product_compare/repo/shared_product_slug_storage_integrity_test.exs
  ```

  Expected before implementation: FAIL because at least one invalid direct
  insert succeeds instead of returning the expected named check violation.

- [ ] **Step 4: Add the forward migration**

  In `up/0`, execute a `DO $$ ... $$` preflight that raises when either table
  contains a row not matching `^[a-z0-9]+(-[a-z0-9]+)*$`. After the preflight,
  create these checks:

  ```elixir
  create constraint(:products, :products_slug_canonical_format,
           check: "slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'"
         )

  create constraint(:product_slug_aliases, :product_slug_aliases_slug_canonical_format,
           check: "slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'"
         )
  ```

  In `down/0`, drop exactly those two named constraints. Do not alter any
  reservation index, trigger, or function.

- [ ] **Step 5: Map both named checks in their owning changesets**

  Keep both existing `validate_format/3` calls unchanged. After each format
  validation, add the table-specific mapping:

  ```elixir
  check_constraint(changeset, :slug, name: :products_slug_canonical_format)
  ```

  for `Product.changeset/2`, and:

  ```elixir
  check_constraint(changeset, :slug,
    name: :product_slug_aliases_slug_canonical_format
  )
  ```

  for `ProductSlugAlias.changeset/2`. Express these through the existing
  changeset pipelines; add no helper module or shared macro.

- [ ] **Step 6: Run the focused test and verify GREEN**

  Run:

  ```bash
  mix test test/product_compare/repo/shared_product_slug_storage_integrity_test.exs
  ```

  Expected: PASS; all invalid direct writes report their exact owning
  constraint, and all canonical controls remain accepted.

- [ ] **Step 7: Verify downstream reservation, lookup, search, and GraphQL parity**

  Run:

  ```bash
  mix test test/product_compare/catalog/product_lookup_test.exs test/product_compare/catalog/search_documents_test.exs test/product_compare_web/graphql/catalog_queries_test.exs
  ```

  Expected: PASS with cross-table reservation uniqueness, historical-alias
  immutability, canonical and historical lookup, search-document refresh, and
  catalog GraphQL behavior unchanged.

- [ ] **Step 8: Run repository gates**

  Run:

  ```bash
  mix format --check-formatted
  mix typecheck
  mix quality
  mix test
  mix work_queue.validate
  git diff --check
  ```

  Expected: every command exits zero. Queue closeout remains coordinator-owned;
  do not edit shared queue, catalog, or history documents from this worker row.

- [ ] **Step 9: Record evidence and commit the implementation milestone**

  Replace the prospective `Target Outcome` and `Ready Evidence` in
  `docs/work/shared-product-slug-storage-integrity.md` with observed completion
  and verification results.

  ```bash
  git add priv/repo/migrations/20260805080000_enforce_shared_product_slug_storage_integrity.exs lib/product_compare_schemas/catalog/product.ex lib/product_compare_schemas/catalog/product_slug_alias.ex test/product_compare/repo/shared_product_slug_storage_integrity_test.exs docs/work/shared-product-slug-storage-integrity.md docs/superpowers/plans/2026-08-05-shared-product-slug-storage-integrity-implementation-plan.md
  git commit -m "test: enforce shared product slug storage integrity"
  ```

Exit condition: PostgreSQL rejects non-canonical canonical and historical
product slugs with the correct named constraints, accepted values are unchanged,
existing reservation and immutability behavior remains green, and all backend
gates pass.
