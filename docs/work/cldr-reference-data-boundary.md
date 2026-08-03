# CLDR Reference Data Boundary

## Snapshot

- Status: active
- Priority: P3
- Plan: `docs/superpowers/plans/2026-08-01-cldr-reference-data-boundary-implementation-plan.md`
- Design: `docs/superpowers/specs/2026-08-01-attribution-observability-and-foundation-libraries-design.md`
- Last verified: 2026-08-01 against seeded currency/country/language tables, Ecto codecs, feed-candidate normalization, and database parity tests.

## Target Outcome

CLDR owns standards recognition and metadata for currencies, territories, and languages while ProductCompare explicitly owns its supported subset and stable relational IDs.

## Validated Scope

- Currency codes are a four-entry deterministic Ecto type mirrored by the seeded table.
- Feed candidates use CA/US and EN/FR maps plus application-owned feed-type codes.
- Database-parity tests already prevent codec/seed drift.
- Some relational IDs are application-specific, so runtime CLDR data cannot replace every supported-code map.

## Boundaries

- Do not expand supported markets, query the repository from Ecto types, or call CLDR from migrations.
- Keep application-owned reference codes outside CLDR.
- Add no backend formatting, Money abstraction, or unit library.
- Preserve exact database IDs and unsupported-code behavior.

## Verification

- focused standards recognition and metadata tests
- database/codec/CLDR parity tests
- currency consumers, CJ/feed-candidate ingestion, attribution, and GraphQL suites
- dependency checks and full repository gates
- `mix work_queue.validate`
- `git diff --check`

## Evidence

- 2026-08-03: Task 1 added the minimal `en` CLDR backend and the focused
  `ProductCompare.ReferenceData` recognition/metadata boundary. Valid but
  unsupported standard codes remain distinct from the application-supported
  currency, territory, and language sets; no codec, migration, formatting, or
  Money/unit work was included.
- Verified `mix test test/product_compare/reference_data_test.exs` (6 tests,
  0 failures) and `mix work_queue.validate` (3 ready rows).
