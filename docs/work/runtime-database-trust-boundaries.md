# Runtime And Database Trust Boundaries

## Snapshot

- Status: complete
- Priority: P0
- Plan: `docs/superpowers/plans/2026-08-30-runtime-database-trust-boundaries-implementation-plan.md`
- Design: `docs/superpowers/specs/2026-08-30-whole-project-quality-and-complexity-remediation-design.md`
- Last verified: 2026-08-30 against the focused runtime, commerce,
  relationship-error, GraphQL-error, and community-storage suites.

## Batch Outcome

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

- Same-origin enforcement now derives canonical scheme, host, and effective
  port from configured endpoint authority. A forged request `Host` plus
  matching `Origin` is rejected, while exact configured trusted origins remain
  supported.
- Production requires a valid explicit `PHX_HOST`. Session cookies are
  host-only by default and accept an explicit cookie domain only when it is the
  configured host or one of its non-public parent domains.
- Decimal schema fields use a shared Ecto type that turns `NaN` and both
  infinities into ordinary cast errors without rewriting input maps. Shared
  boundary parsing rejects the same values once, while finite-aware PostgreSQL
  checks reject direct bypass writes and preserve nullable values and finite
  signed deltas.
- Product, product-taxon, and community-report changesets map every cast
  foreign key without relationship preflight queries. GraphQL changeset error
  fields now reuse the existing camelCase normalizer.
- Community write receipt and window tests now prove key shape, digest length,
  non-negative counts, and UTC-hour alignment through both changesets and
  named PostgreSQL checks; the existing schemas required no behavior change.
- The complete focused outcome command passed 149 tests with zero failures on
  `MIX_TEST_PARTITION=quality_runtime`.
- `mix typecheck`, `mix format --check-formatted`, and `git diff --check`
  passed.

## Remaining Work

None in this lane. Ingestion concurrency and observation ordering is the next
active row; three independently shippable outcomes remain ready.
