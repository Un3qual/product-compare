# CLDR Reference Data Boundary

## Snapshot

- Status: done
- Priority: P3
- Plan: `docs/superpowers/plans/2026-08-01-cldr-reference-data-boundary-implementation-plan.md`
- Design: `docs/superpowers/specs/2026-08-01-attribution-observability-and-foundation-libraries-design.md`
- Last verified: 2026-08-03 against seeded currency/country/language tables, Ecto codecs, feed-candidate normalization, database parity tests, dependency checks, and full repository gates.

## Batch Outcome

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
- 2026-08-03: Task 2 routes `CurrencyCode.cast/1` through
  `ReferenceData.canonical_currency/1` before its unchanged private
  CAD/EUR/GBP/USD-to-ID map. The boundary now exposes CLDR's ISO minor-unit
  metadata. Seeded IDs, trimming/casing, field types, and repository-free Ecto
  codec behavior remain unchanged; CLDR-recognized JPY remains unsupported and
  is rejected before CJ import fetching.
- Verified `mix test test/product_compare/reference_data_test.exs
  test/product_compare/repo/reference_code_codec_parity_test.exs
  test/product_compare/commerce_attribution test/product_compare/ingestion
  test/mix/tasks/product_compare_ingestion_cj_import_test.exs` (291 tests,
  0 failures) and `mix format`.
- 2026-08-03: Task 3 adds a default-neutral `standard` option to
  `ReferenceCode`. Only merchant feed candidate territory and language fields
  use it, canonicalizing with `ReferenceData` before their unchanged supported
  maps. CA/US retain IDs 124/840 and EN/FR retain IDs 1/2; CLDR-recognized but
  unsupported GB/DE still normalize to `nil` and reject in the codec. Feed
  types and every other application-owned `ReferenceCode` field keep
  `standard: :none`, and no migrations or repository lookups were added.
- Verified `mix test test/product_compare/reference_data_test.exs
  test/product_compare/repo/reference_code_codec_parity_test.exs
  test/product_compare/ingestion/feed_candidates_test.exs
  test/product_compare/ingestion/sources/cj` (33 tests, 0 failures),
  `mix test test/product_compare/ingestion/cj_feed_discovery_test.exs` (10
  tests, 0 failures), `mix format`, `mix work_queue.validate` (3 ready rows),
  and `git diff --check`.
- 2026-08-03: Final handoff verified supported-set/database-ID parity and the
  complete repository gates: focused CLDR, codec, ingestion, attribution, and
  GraphQL suites (618 tests, 0 failures); `mix deps.unlock --check-unused`;
  `mix format --check-formatted`; `mix typecheck`; `mix quality`; `mix test
  --cover` (1,156 tests, 0 failures, 85.84% total coverage); `mix
  frontend_check` (1,520 frontend tests, client/SSR/bundle checks); `mix
  work_queue.validate` (3 ready rows); and `git diff --check`. The only
  Dialyzer exception is a generated `ex_cldr_languages` 0.3.3 dependency
  false positive, filtered by its exact file/message pair; the filter probe
  proved it does not match a synthetic ProductCompare warning.
