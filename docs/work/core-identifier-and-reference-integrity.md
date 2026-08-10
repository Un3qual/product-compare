# Core Identifier And Reference Integrity

## Snapshot

- Status: complete
- Priority: P1
- Plan:
  `docs/superpowers/plans/2026-08-09-core-identifier-and-reference-integrity-implementation-plan.md`
- Design:
  `docs/superpowers/specs/2026-08-09-core-identifier-and-reference-integrity-design.md`
- Last verified: 2026-08-09 against current schemas, migrations, tests, and the
  approved identifier and Unit-retention decisions.

## Execution Evidence

- Exact identifier preflights returned zero incompatible rows for products,
  aliases, reservations, merchants, affiliate networks, and taxonomy SEO
  slugs.
- RED: the focused suite reported 7 expected failures across exact application
  anchors and the six missing storage checks.
- GREEN: the focused suite passed 10 tests; the identifier regression set
  passed 54 tests across product lookup, merchant, affiliate, taxonomy, SEO,
  and comparison snapshot behavior.
- Numeric-reference preflights returned zero inconsistent companion rows, zero
  inverted ranges, and zero orphaned Unit references; the inspected foreign key
  still used `ON DELETE SET NULL` before replacement.
- RED: the numeric-reference suite reported 9 expected failures across the two
  missing checks, referenced-Unit deletion, and the missing changeset mapping.
- GREEN: the numeric-reference suite passed 12 tests and its affected
  specification boundary passed 52 tests.
- The complete affected boundary passed 180 tests. The definitive backend run
  passed 1,327 tests; typecheck and the complete quality pipeline also passed.
- The test database was rebuilt before implementation because migration status
  proved it retained obsolete migration identities; the clean baseline then
  passed 1,305 tests.

## Batch Outcome

PostgreSQL and Ecto now agree on the established exact formats for canonical
core identifiers. Numeric claims cannot contradict or lose their required
companion facts, referenced Units cannot be deleted, and unreferenced Units
remain deletable. The work shipped as one reviewer-sized persisted-integrity
batch.

## Enforced Constraints

- `products_slug_format_check`
- `product_slug_aliases_slug_format_check`
- `product_slug_reservations_slug_format_check`
- `merchants_slug_format_check`
- `affiliate_networks_code_format_check`
- `taxons_seo_slug_format_check`
- existing `comparison_snapshots_public_token_format`, now mapped by its owner
- `product_attribute_claims_numeric_companions_check`
- `product_attribute_claims_numeric_range_order_check`
- `product_attribute_claims_unit_id_fkey`, replaced with `ON DELETE RESTRICT`

## Approved Decisions

- Product, historical-alias, merchant, taxonomy SEO, and stored
  affiliate-network identifiers reject trailing newlines through exact
  whole-string semantics; affiliate-network input retains normalization before
  stored-code validation.
- Comparison snapshot token changesets and lookup filtering use the exact
  already-persisted token contract.
- A Unit cannot be deleted while a numeric product-attribute claim references
  it; unreferenced Units retain current deletion behavior.

## Owned Paths

- `priv/repo/migrations/20260809130100_enforce_core_identifier_storage_integrity.exs`
- `priv/repo/migrations/20260809130200_enforce_product_attribute_claim_reference_integrity.exs`
- `lib/product_compare_schemas/catalog/product.ex`
- `lib/product_compare_schemas/catalog/product_slug_alias.ex`
- `lib/product_compare_schemas/catalog/comparison_snapshot.ex`
- `lib/product_compare_schemas/pricing/merchant.ex`
- `lib/product_compare_schemas/affiliate/affiliate_network.ex`
- `lib/product_compare_schemas/taxonomy/taxon.ex`
- `lib/product_compare_schemas/specs/product_attribute_claim.ex`
- `lib/product_compare/comparison_snapshots/lifecycle.ex`
- `test/product_compare/repo/core_identifier_storage_integrity_test.exs`
- `test/product_compare/repo/product_attribute_claim_reference_integrity_test.exs`
- affected identifier, taxonomy, comparison, specification, ingestion, catalog,
  recommendation, SEO, and GraphQL tests named by the implementation plan
- `docs/work/core-identifier-and-reference-integrity.md`
- `docs/work/index.md`
- `docs/plans/INDEX.md`
- `docs/plans/2026-07-31-work-index-history.md`
- the superseded commerce identifier lane, design, and plan

## Internal Slices

1. Exact identifier constraints and local application patterns for product,
   historical-alias, reservation, merchant, affiliate-network, taxonomy SEO,
   and comparison snapshot token boundaries.
2. Numeric claim companion and range checks plus restrictive referenced-Unit
   lifecycle behavior.
3. Consolidated dispatch, affected and full verification, completion history,
   and removal of the superseded commerce-only draft documents.

## Verified Preconditions

- Exact identifier, numeric-companion, numeric-range, and Unit-reference
  preflights returned zero invalid rows immediately before implementation.
- `product_attribute_claims_unit_id_fkey` targeted `units(id)` with
  `ON DELETE SET NULL` before replacement.
- Existing product namespace triggers and comparison token check retained their
  names and behavior.
- No other active row owned an implementation path.

## Boundaries

- Add no identifier length, normalization, trimming, Unicode, or generation
  policy.
- Add no numeric finiteness policy, Unit deletion API, generic constraint
  helper, schema macro, or data-repair path.
- Preserve existing slug generation and lookup, taxonomy publication, snapshot
  generation, affiliate normalization, typed-value normalization, conversion,
  selection, ingestion, and GraphQL behavior.
- Deferred discussions/community, eBay, dashboard, email, privacy, and
  production-readiness scope remains closed.

## Verification

- two focused direct-write integrity suites with RED then GREEN evidence
- existing product namespace, merchant, affiliate, taxonomy, SEO, comparison,
  specification, ingestion, catalog, recommendation, snapshot, and GraphQL
  consumer suites named by the plan
- `mix test`
- `mix typecheck`
- `mix quality`
- `mix format --check-formatted`
- `mix work_queue.validate`
- `git diff --check`

## Blocker Rule

Stop if a preflight returns data, an expected constraint or trigger has drifted,
or an owned path conflicts with active work. Record exact identifiers and do not
rewrite rows or widen policy to continue.

## Completion

All exact identifier, numeric companion, range, and referenced-Unit boundaries
passed focused and repository verification. One observed completion record
closed the consolidated row, and no internal slice was promoted separately.
