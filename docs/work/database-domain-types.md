# Database Domain Types Work Doc

## Snapshot

- Status: active
- Priority: P1
- Source of truth: `docs/superpowers/plans/2026-07-30-database-domain-types-implementation-plan.md`
- Last verified: 2026-07-30 after the commerce-reference milestone gates.

## Target Outcome

Every first-party categorical database value is stored as a native PostgreSQL
enum, a foreign key to controlled reference data, or is removed because it is
redundant. Application-owned comparison and alert facts are normalized out of
JSON, while provider-owned raw evidence remains verbatim and is never used as
normalized domain state.

## Completed Batches

- Native PostgreSQL enum storage for the 28 approved closed-domain columns.
- Physical storage is verified through `information_schema`, not inferred from
  `Ecto.Enum`.
- Existing lifecycle, transaction, GraphQL, and query behavior remains covered
  by the focused context suites.
- Currency codes, affiliate-program statuses, and affiliate-network identities
  are controlled reference rows.
- Seven operational currency owners, affiliate programs, and conversions store
  numeric foreign keys while Ecto and GraphQL continue to expose stable codes.
- Commerce links derive network identity through their required affiliate
  program instead of storing a second value that can drift.
- Existing affiliate-network upserts avoid a no-op `updated_at` write, removing
  the row lock that reproduced a cross-fixture deadlock at seed `284640`.

## Active Batch

- Source/provider reference domains consume the canonical currency reference.
- Source kinds, providers, integration surfaces, feed types, countries, and
  languages become controlled references.
- Provider strings duplicated by source ownership are removed from ingestion
  runs and feed candidates.

## Dependent Successors

- Redundant discriminator removal waits for overlapping ingestion paths to be
  released.
- Application-owned comparison snapshot and alert fact JSON normalization
  follows the reference-domain milestones.

## Verification

- Baseline repair commit: `506fff4f test: stabilize catalog filter index contract`
- `mix test test/product_compare/catalog/filtering_regression_test.exs`:
  8 tests, 0 failures.
- `MIX_ENV=test mix ecto.reset`: all migrations applied through
  `20260727121000`.
- `mix test test/product_compare/repo/domain_enum_storage_test.exs`: 1 test,
  0 failures.
- Focused enum-owning context suites: 438 tests, 0 failures.
- `mix test`: 978 tests, 0 failures.
- `mix typecheck`, `mix format --check-formatted`, `mix work_queue.validate`,
  and `git diff --check`: passed.
- `mix test test/product_compare/repo/domain_reference_storage_test.exs`:
  3 tests, 0 failures.
- Focused commerce-reference context and GraphQL suites: 277 tests, 0 failures.
- `mix test --seed 284640`: 982 tests, 0 failures.
- `mix typecheck`: passed.

## Blocker Rule

Stop and record a blocker if a provider-owned raw field is required for
application filtering, if a proposed reference code cannot be mapped without
inventing data, or if a migration would require compatibility dual writes.
