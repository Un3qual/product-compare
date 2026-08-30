# Runtime And Database Trust Boundaries

## Snapshot

- Status: active
- Priority: P0
- Plan: `docs/superpowers/plans/2026-08-30-runtime-database-trust-boundaries-implementation-plan.md`
- Design: `docs/superpowers/specs/2026-08-30-whole-project-quality-and-complexity-remediation-design.md`

## Target Outcome

Configured Phoenix authority, finite commerce facts, mapped relationships, and
community storage constraints fail closed at both the application and database
boundaries without host-header trust, sibling-domain cookie sharing, preflight
relationship queries, or generic constraint machinery.

## Owned Paths

- `config/runtime.exs`
- `lib/product_compare_web/endpoint.ex`
- `lib/product_compare_web/runtime_config.ex`
- `lib/product_compare_web/plugs/require_same_origin.ex`
- `lib/product_compare_web/graphql/errors.ex`
- `lib/product_compare_schemas/commerce_attribution/commerce_conversion.ex`
- `lib/product_compare_schemas/commerce_attribution/purchase_price_fact.ex`
- `lib/product_compare_schemas/catalog/product.ex`
- `lib/product_compare_schemas/taxonomy/product_taxon.ex`
- `lib/product_compare_schemas/discussions/community_report.ex`
- `lib/product_compare_schemas/discussions/community_write_receipt.ex`
- `lib/product_compare_schemas/discussions/community_write_window.ex`
- `priv/repo/migrations/20260830120000_enforce_commerce_numeric_integrity.exs`
- Focused tests named by the plan
- This lane document

## Internal Slices

1. Configured same-origin and host-only session authority.
2. Finite commerce changesets and PostgreSQL checks.
3. Foreign-key mappings and camelCase mutation fields.
4. Direct community write-storage constraint evidence.

## Blocker Rule

Stop if production host/cookie policy requires a product deployment decision,
if a numeric field's accepted sign/nullability cannot be recovered from current
constraints and callers, or if a proposed relationship check would require a
race-prone preflight query.

## Completion Evidence

Pending implementation. Record focused RED/GREEN commands, migration review,
typecheck/format evidence, and the milestone commit here.
