# Core Identifier And Reference Integrity

## Snapshot

- Status: ready
- Priority: P1
- Plan:
  `docs/superpowers/plans/2026-08-09-core-identifier-and-reference-integrity-implementation-plan.md`
- Design:
  `docs/superpowers/specs/2026-08-09-core-identifier-and-reference-integrity-design.md`
- Last verified: 2026-08-09 against current schemas, migrations, tests, and the
  approved identifier and Unit-retention decisions.

## Target Outcome

PostgreSQL and Ecto agree on the established exact formats for canonical core
identifiers, numeric claims cannot contradict or lose their required companion
facts, and all changes ship as one reviewer-sized persisted-integrity batch.

## Approved Decisions

- Product, historical-alias, merchant, taxonomy SEO, and affiliate-network
  identifiers reject trailing newlines through exact whole-string semantics.
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

## Prerequisites

- Exact identifier, numeric-companion, numeric-range, and Unit-reference
  preflights return zero invalid rows immediately before implementation.
- `product_attribute_claims_unit_id_fkey` still targets `units(id)` with
  `ON DELETE SET NULL` before replacement.
- Existing product namespace triggers and comparison token check retain their
  current names and behavior.
- No active row owns any listed implementation path.

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

## Exit Condition

All exact identifier, numeric companion, range, and referenced-Unit boundaries
pass focused and repository verification; one observed completion record closes
the consolidated row; and no internal slice is promoted separately.
